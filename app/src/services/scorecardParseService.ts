import { ENV } from "@/config/env";

const API_BASE = ENV.COURSE_API_URL;

export interface ParsedHole {
  hole: number;
  par: number | null;
  yards: number | null;
}

export interface ParsedPlayer {
  name: string | null;
  scores: { hole: number; strokes: number }[];
}

export interface ParsedScorecard {
  course_name: string | null;
  date: string | null;
  holes: ParsedHole[];
  players: ParsedPlayer[];
}

/**
 * Upload a scorecard photo and have the course-api extract hole-by-hole
 * scores via Claude vision. The server does not persist the image.
 */
export async function parseScorecardImage(file: File): Promise<ParsedScorecard> {
  const form = new FormData();
  form.append("file", file, file.name);

  const headers: Record<string, string> = {};
  if (ENV.SCORECARD_AUTH_SECRET) {
    headers["X-Scorecard-Auth"] = ENV.SCORECARD_AUTH_SECRET;
  }

  const res = await fetch(`${API_BASE}/scorecard/parse`, {
    method: "POST",
    body: form,
    headers,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
      }
    } catch {
      /* non-json response */
    }
    throw new Error(detail);
  }

  return (await res.json()) as ParsedScorecard;
}
