"""Trace golf course features from satellite imagery using Gemini Vision.

Hybrid approach: Gemini identifies hole routing paths and feature locations,
then we generate smooth geometric polygons from those paths.

Uses the Gemini REST API directly via httpx (no extra dependency).
"""

import base64
import json
import logging
import math
import re

import httpx

from config import settings

logger = logging.getLogger(__name__)

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent"
)

# Compact prompt — keeps Gemini from overthinking and corrupting JSON.
TRACING_PROMPT = """\
Analyze this satellite image of a golf course ({width}x{height} pixels).
For each visible golf hole, identify the fairway center path and green position.
Return JSON: {{"holes": [{{"hole_number": 1, "tee": [x,y], "path": [[x,y],...], \
"green": [x,y], "green_radius": 15, "fairway_width": 45, "bunkers": [[x,y]], \
"water": []}}]}}
All coordinates in pixels (0-{width}). Each path should have 5-10 points \
tracing the center of the fairway from tee to green. For doglegged holes, \
add extra points at the bend. Trace ALL visible holes (expect 9 or 18). \
Return ONLY valid JSON."""


class GeminiTracer:
    """Traces golf course features from satellite images via Gemini Vision."""

    def __init__(self):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not set")
        self.api_key = settings.gemini_api_key
        self.model = "gemini-2.5-flash"

    async def trace_course(
        self,
        image_bytes: bytes,
        width: int,
        height: int,
        course_name: str = "",
    ) -> list[dict]:
        """Send satellite image to Gemini and get hole routing data.

        Returns:
            List of hole dicts with path, green, bunkers, etc. in pixel coords.
        """
        prompt = TRACING_PROMPT.format(width=width, height=height)
        if course_name:
            prompt += f"\n\nThis satellite image shows **{course_name}**."

        image_b64 = base64.b64encode(image_bytes).decode()

        url = GEMINI_API_URL.format(model=self.model)
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": image_b64,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 16384,
                "responseMimeType": "application/json",
            },
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                params={"key": self.api_key},
                json=payload,
                timeout=120.0,
            )

            if resp.status_code != 200:
                error_text = resp.text[:500]
                raise RuntimeError(
                    f"Gemini API error {resp.status_code}: {error_text}"
                )

            result = resp.json()

        # Extract text
        try:
            text = result["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise RuntimeError(f"Unexpected Gemini response structure: {e}")

        # Parse JSON (with recovery for minor issues)
        data = _parse_json_robust(text)

        holes = data.get("holes", [])
        logger.info(
            f"Gemini identified {len(holes)} holes for '{course_name}'"
        )
        return holes

    def generate_features(
        self,
        holes: list[dict],
        bounds: dict,
        img_width: int,
        img_height: int,
    ) -> list[dict]:
        """Convert Gemini hole data to polygon features in [lon, lat] coords.

        Takes the routing paths from Gemini and generates smooth polygons
        using geometric estimation (corridors, ellipses).
        """
        lat_range = bounds["maxLat"] - bounds["minLat"]
        lon_range = bounds["maxLon"] - bounds["minLon"]

        def px_to_lonlat(px: float, py: float) -> tuple[float, float]:
            lon = bounds["minLon"] + (px / img_width) * lon_range
            lat = bounds["maxLat"] - (py / img_height) * lat_range
            return (lon, lat)

        def px_to_meters(px_dist: float) -> float:
            """Approximate pixel distance to meters."""
            # At the image center latitude
            center_lat = (bounds["minLat"] + bounds["maxLat"]) / 2
            deg_per_px_lon = lon_range / img_width
            meters_per_deg_lon = 111320.0 * math.cos(math.radians(center_lat))
            return px_dist * deg_per_px_lon * meters_per_deg_lon

        features: list[dict] = []

        for hole in holes:
            hole_num = hole.get("hole_number", 0)

            # --- FAIRWAY corridor ---
            path = hole.get("path", [])
            tee = hole.get("tee")
            green = hole.get("green")

            # Build full path: tee → path → green
            full_path = []
            if tee and len(tee) == 2:
                full_path.append(px_to_lonlat(tee[0], tee[1]))
            for pt in path:
                if len(pt) == 2:
                    full_path.append(px_to_lonlat(pt[0], pt[1]))
            if green and len(green) == 2:
                full_path.append(px_to_lonlat(green[0], green[1]))

            if len(full_path) >= 2:
                fw_width_px = hole.get("fairway_width", 45)
                # Convert pixel width to degrees
                half_w_lon = (fw_width_px / 2 / img_width) * lon_range
                half_w_lat = (fw_width_px / 2 / img_height) * lat_range

                corridor = _corridor_polygon(full_path, half_w_lon, half_w_lat)
                if corridor:
                    features.append({
                        "type": "fairway",
                        "points": [[p[0], p[1]] for p in corridor],
                        "hole_number": hole_num,
                    })

            # --- TEE rectangle ---
            if tee and len(tee) == 2:
                tee_lon, tee_lat = px_to_lonlat(tee[0], tee[1])
                # Tee size: ~12px
                tee_half_lon = (6 / img_width) * lon_range
                tee_half_lat = (4 / img_height) * lat_range
                # Orientation toward first path point
                angle = 0
                if len(full_path) >= 2:
                    dx = full_path[1][0] - full_path[0][0]
                    dy = full_path[1][1] - full_path[0][1]
                    angle = math.atan2(dy, dx)

                tee_poly = _rotated_rect(
                    tee_lon, tee_lat, tee_half_lon, tee_half_lat, angle
                )
                features.append({
                    "type": "tee",
                    "points": [[p[0], p[1]] for p in tee_poly],
                    "hole_number": hole_num,
                })

            # --- GREEN ellipse ---
            if green and len(green) == 2:
                g_lon, g_lat = px_to_lonlat(green[0], green[1])
                g_radius_px = hole.get("green_radius", 15)
                g_r_lon = (g_radius_px / img_width) * lon_range
                g_r_lat = (g_radius_px / img_height) * lat_range

                green_poly = _ellipse_polygon(
                    g_lon, g_lat, g_r_lon, g_r_lat * 1.2, n=16
                )
                features.append({
                    "type": "green",
                    "points": [[p[0], p[1]] for p in green_poly],
                    "hole_number": hole_num,
                })

            # --- BUNKERS ---
            for bpos in hole.get("bunkers", []):
                if len(bpos) == 2:
                    b_lon, b_lat = px_to_lonlat(bpos[0], bpos[1])
                    b_r_lon = (7 / img_width) * lon_range
                    b_r_lat = (5 / img_height) * lat_range
                    bunker_poly = _ellipse_polygon(
                        b_lon, b_lat, b_r_lon * 1.3, b_r_lat, n=10
                    )
                    features.append({
                        "type": "bunker",
                        "points": [[p[0], p[1]] for p in bunker_poly],
                        "hole_number": hole_num,
                    })

            # --- WATER ---
            for wpos in hole.get("water", []):
                if len(wpos) == 2:
                    w_lon, w_lat = px_to_lonlat(wpos[0], wpos[1])
                    w_r_lon = (18 / img_width) * lon_range
                    w_r_lat = (14 / img_height) * lat_range
                    water_poly = _ellipse_polygon(
                        w_lon, w_lat, w_r_lon, w_r_lat, n=12
                    )
                    features.append({
                        "type": "water",
                        "points": [[p[0], p[1]] for p in water_poly],
                        "hole_number": hole_num,
                    })

        logger.info(
            f"Generated {len(features)} polygon features from "
            f"{len(holes)} traced holes"
        )
        return features


# ---------------------------------------------------------------------------
# Geometry helpers (lon/lat space)
# ---------------------------------------------------------------------------

def _ellipse_polygon(
    cx: float, cy: float, rx: float, ry: float,
    rotation: float = 0.0, n: int = 16,
) -> list[tuple[float, float]]:
    """Generate ellipse polygon points in (lon, lat) space."""
    cos_r = math.cos(rotation)
    sin_r = math.sin(rotation)
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x = rx * math.cos(a)
        y = ry * math.sin(a)
        pts.append((cx + x * cos_r - y * sin_r, cy + x * sin_r + y * cos_r))
    return pts


def _rotated_rect(
    cx: float, cy: float, half_w: float, half_h: float, angle: float,
) -> list[tuple[float, float]]:
    """Generate rotated rectangle in (lon, lat) space."""
    cos_a = math.cos(angle)
    sin_a = math.sin(angle)
    corners = [(-half_w, -half_h), (half_w, -half_h),
               (half_w, half_h), (-half_w, half_h)]
    return [(cx + dx * cos_a - dy * sin_a, cy + dx * sin_a + dy * cos_a)
            for dx, dy in corners]


def _corridor_polygon(
    path: list[tuple[float, float]],
    half_w_lon: float,
    half_w_lat: float,
) -> list[tuple[float, float]]:
    """Generate a corridor (wide path) polygon around a center line.

    Path points are (lon, lat). Returns a closed polygon.
    """
    if len(path) < 2:
        return []

    left = []
    right = []

    for i in range(len(path)):
        # Direction vector
        if i == 0:
            dx = path[1][0] - path[0][0]
            dy = path[1][1] - path[0][1]
        elif i == len(path) - 1:
            dx = path[i][0] - path[i - 1][0]
            dy = path[i][1] - path[i - 1][1]
        else:
            dx = path[i + 1][0] - path[i - 1][0]
            dy = path[i + 1][1] - path[i - 1][1]

        length = math.hypot(dx, dy)
        if length == 0:
            nx, ny = 0, 0
        else:
            # Normal (perpendicular) vector
            nx = -dy / length
            ny = dx / length

        # Taper width: narrower at tee, widest at 40%, narrower at green
        t = i / max(len(path) - 1, 1)
        taper = math.sin(math.pi * min(t * 1.3, 1.0)) * 0.85 + 0.15

        left.append((
            path[i][0] + nx * half_w_lon * taper,
            path[i][1] + ny * half_w_lat * taper,
        ))
        right.append((
            path[i][0] - nx * half_w_lon * taper,
            path[i][1] - ny * half_w_lat * taper,
        ))

    return left + list(reversed(right))


def _parse_json_robust(text: str) -> dict:
    """Parse JSON with recovery for common Gemini formatting issues."""
    text = text.strip()

    # Strip markdown code fences
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3].rstrip()

    # First try: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fix trailing commas before } or ]
    cleaned = re.sub(r",\s*([}\]])", r"\1", text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try to find the JSON object in the text
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    # Last resort: try to fix truncated JSON by closing brackets
    truncated = cleaned.rstrip()
    # Count open/close brackets
    open_braces = truncated.count("{") - truncated.count("}")
    open_brackets = truncated.count("[") - truncated.count("]")
    # Remove any trailing comma
    truncated = re.sub(r",\s*$", "", truncated)
    truncated += "]" * open_brackets + "}" * open_braces
    try:
        return json.loads(truncated)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini JSON: {e}")
        logger.debug(f"Raw text (first 500 chars): {text[:500]}")
        raise
