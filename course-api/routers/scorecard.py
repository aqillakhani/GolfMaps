"""Scorecard photo → structured scores via Claude vision.

Endpoint: POST /api/scorecard/parse (multipart file upload).
The image is sent to Anthropic and discarded immediately after processing —
the server does not persist uploads.
"""

import base64
import hmac
import json
import logging
import os
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import APIRouter, File, Header, HTTPException, Request, UploadFile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scorecard")

MAX_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_MEDIA = {"image/jpeg", "image/png", "image/webp", "image/gif"}
VISION_MODEL = "claude-haiku-4-5-20251001"

# --- Rate limiting (per-IP sliding window) --------------------------------
# Lightweight in-memory limiter so we don't depend on redis. Single-instance
# Fly deployments are fine; if we scale out we'll move to redis.
_RATE_LIMIT_WINDOW_SECONDS = 3600  # 1 hour
_RATE_LIMIT_MAX_HITS = 20  # per IP per window
_rate_buckets: dict[str, deque[float]] = defaultdict(deque)
_rate_lock = Lock()


def _check_rate_limit(client_ip: str) -> None:
    """Raise 429 if this client has exceeded the per-hour quota."""
    now = time.monotonic()
    cutoff = now - _RATE_LIMIT_WINDOW_SECONDS
    with _rate_lock:
        bucket = _rate_buckets[client_ip]
        while bucket and bucket[0] < cutoff:
            bucket.popleft()
        if len(bucket) >= _RATE_LIMIT_MAX_HITS:
            retry_after = int(bucket[0] + _RATE_LIMIT_WINDOW_SECONDS - now) + 1
            raise HTTPException(
                status_code=429,
                detail=f"Too many scorecard uploads from this client. Try again in {retry_after}s.",
                headers={"Retry-After": str(max(1, retry_after))},
            )
        bucket.append(now)


def _verify_auth(provided: str | None) -> None:
    """Require a shared-secret header when SCORECARD_AUTH_SECRET is set.

    The secret is required in production. If unset (dev), auth is skipped but
    a warning is logged so we notice before shipping.
    """
    expected = os.environ.get("SCORECARD_AUTH_SECRET")
    if not expected:
        logger.warning("SCORECARD_AUTH_SECRET unset — scorecard endpoint is unauthenticated")
        return
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing auth token.")

EXTRACTION_PROMPT = """You are reading a golf scorecard photo and extracting the player's handwritten stroke counts.

Return ONLY valid JSON (no markdown fences, no prose) matching this exact schema:

{
  "course_name": string | null,
  "date": string | null,
  "holes": [
    { "hole": int, "par": int | null, "yards": int | null }
  ],
  "players": [
    {
      "name": string | null,
      "scores": [
        { "hole": int, "strokes": int }
      ]
    }
  ]
}

SCORECARDS COME IN TWO LAYOUTS — handle both:

  (A) HORIZONTAL: holes run left-to-right as columns, each player occupies a horizontal row
      of handwritten digits.

  (B) VERTICAL: each row is a hole (1, 2, 3, …, 18). Columns are data fields
      (Member Tees, Masters Tees, Par, Handicap Rating, Score, Putts, etc.). The player's
      scores are a VERTICAL column of handwritten digits, one per hole row.

CRITICAL — DO NOT EXTRACT THESE COLUMNS (they are printed course data, never scores):
- Par
- Yards / Yardage / Yds
- "Member Tees", "Masters Tees", "Blue", "White", "Gold", "Red", "Black", "Tips",
  or any other tee name — these are printed yardage figures
- HCP / Handicap / "Handicap Rating" / "Hdcp" — this is a column of 1-18 where each value
  appears EXACTLY ONCE across all 18 holes. If you notice the numbers 1 through 18 each
  appearing once (in any order) down a column, that column is handicap rating — IGNORE IT.

DO EXTRACT:
- The column (or row) of HANDWRITTEN digits representing the player's strokes. This is
  typically labeled "Score", "Scr", "Strokes", or has a player's name at the top, or is
  the only messy handwritten column on the card. Handwritten scores are in pen or pencil,
  with varied size/slant/spacing — NOT uniform printed digits.
- Score values are usually 2-8 per hole (occasionally up to 12). They should NOT contain
  every integer from 1-18 each appearing once — that pattern means you are looking at the
  handicap column by mistake.
- If a column labeled "Putts", "Put", or "P" sits next to the score column, do NOT
  emit its values — putts are not strokes.

SANITY CHECKS (use these before finalizing):
1. Look for handwritten Out / In / Total sums on the scorecard (e.g. "Out 55", "In 58",
   "Total 113"). The individual scores you extract MUST add up to those totals. If they
   don't match, re-examine your readings — you are probably looking at the wrong column.
2. The set of scores should NOT be {1, 2, 3, ..., 18} each appearing once — that is the
   handicap rating column. If your extraction looks like that, discard it and find the
   real handwritten score column.
3. Average par for 18 holes is 72. Typical amateur totals are 80-120. If your extracted
   total is far outside that, something is wrong.

EXTRACTION RULES:
- Only emit holes numbered 1 through 18. Skip total cells labeled OUT, IN, TOT, TOTAL, NET.
- Emit your best reading of each handwritten score even if slightly smudged. Only omit a
  hole if no digit is visible at all.
- Valid stroke values are 1-15. Discard any reading outside that range.
- Emit ONE entry in "players" per distinct handwritten score set found on the card.
- If no handwritten score set is found, return "players": [].
- Populate "holes" with printed par/yardage when visible.
- Output a single JSON object and nothing else — no markdown, no explanation.
"""


def _strip_fences(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        lines = t.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        t = "\n".join(lines)
    return t.strip()


def _normalize(parsed: dict) -> dict:
    """Clamp / validate extracted data so clients always receive a predictable shape."""
    out: dict = {
        "course_name": parsed.get("course_name") or None,
        "date": parsed.get("date") or None,
        "holes": [],
        "players": [],
    }

    for h in parsed.get("holes") or []:
        try:
            hole_num = int(h.get("hole"))
        except (TypeError, ValueError):
            continue
        if not (1 <= hole_num <= 18):
            continue
        par = h.get("par")
        yards = h.get("yards")
        out["holes"].append({
            "hole": hole_num,
            "par": int(par) if isinstance(par, (int, float)) else None,
            "yards": int(yards) if isinstance(yards, (int, float)) else None,
        })

    for p in parsed.get("players") or []:
        scores = []
        seen_holes: set[int] = set()
        for s in p.get("scores") or []:
            try:
                hole = int(s.get("hole"))
                strokes = int(s.get("strokes"))
            except (TypeError, ValueError):
                continue
            if hole in seen_holes:
                continue
            if 1 <= hole <= 18 and 1 <= strokes <= 15:
                scores.append({"hole": hole, "strokes": strokes})
                seen_holes.add(hole)

        # Reject if the result looks like the handicap rating column — a permutation
        # of 1..N where N is the number of extracted scores (each value appears exactly
        # once and the set equals {1..N}). Scores rarely form that pattern.
        if scores:
            values = sorted(s["strokes"] for s in scores)
            if len(values) >= 9 and values == list(range(1, len(values) + 1)):
                logger.warning(
                    "Rejecting player — looks like handicap rating column (perm of 1..N)"
                )
                continue

        if scores:
            out["players"].append({
                "name": (p.get("name") or None),
                "scores": sorted(scores, key=lambda s: s["hole"]),
            })

    return out


@router.post("/parse")
async def parse_scorecard(
    request: Request,
    file: UploadFile = File(...),
    x_scorecard_auth: str | None = Header(default=None, alias="X-Scorecard-Auth"),
):
    """Extract hole-by-hole scores from an uploaded scorecard photo."""
    _verify_auth(x_scorecard_auth)

    client_ip = request.client.host if request.client else "unknown"
    # Honor reverse proxy forwarded IPs (Fly / Cloudflare)
    forwarded = request.headers.get("fly-client-ip") or request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    _check_rate_limit(client_ip)

    if file.content_type not in ALLOWED_MEDIA:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image type: {file.content_type}. Use JPEG, PNG, WebP, or GIF.",
        )

    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty upload.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Image is larger than 10 MB.")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Scorecard vision is not configured. "
                "Set ANTHROPIC_API_KEY in the course-api environment."
            ),
        )

    try:
        from anthropic import Anthropic
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="The 'anthropic' Python package is not installed on the server.",
        )

    client = Anthropic(api_key=api_key)
    image_b64 = base64.standard_b64encode(data).decode("ascii")

    try:
        message = client.messages.create(
            model=VISION_MODEL,
            max_tokens=1536,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": file.content_type,
                                "data": image_b64,
                            },
                        },
                        {"type": "text", "text": EXTRACTION_PROMPT},
                    ],
                }
            ],
        )
    except Exception as exc:
        logger.exception("Anthropic vision call failed")
        raise HTTPException(status_code=502, detail=f"Vision provider error: {exc}")

    if not message.content:
        raise HTTPException(status_code=502, detail="Empty response from vision model.")

    raw_text = ""
    for block in message.content:
        if getattr(block, "type", None) == "text":
            raw_text += getattr(block, "text", "")
    raw_text = _strip_fences(raw_text)
    if not raw_text:
        raise HTTPException(status_code=502, detail="Vision model returned no text.")

    try:
        parsed = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        logger.warning("Vision returned non-JSON: %s", raw_text[:200])
        raise HTTPException(
            status_code=502,
            detail=f"Could not parse scorecard data: {exc.msg}",
        )

    return _normalize(parsed)
