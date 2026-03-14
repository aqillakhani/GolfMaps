import { createClient } from "@supabase/supabase-js";
import { ENV } from "../config/env";

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials not configured. Auth and persistence will be unavailable.");
}

export const supabase = createClient(
  ENV.SUPABASE_URL || "https://placeholder.supabase.co",
  ENV.SUPABASE_ANON_KEY || "placeholder",
);

// Database types
export interface DBProfile {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

export interface DBSavedPoster {
  id: string;
  user_id: string;
  course_id: string;
  style_id: string;
  is_favorite: boolean;
  custom_text: string | null;
  toggles: Record<string, boolean> | null;
  image_url: string | null;
  created_at: string;
}

export interface DBCollection {
  id: string;
  user_id: string;
  collection_type: string;
  course_id: string;
  created_at: string;
}

export interface DBRound {
  id: string;
  user_id: string;
  course_id: string;
  date_played: string;
  score: number | null;
  notes: string | null;
  scorecard_photo_url: string | null;
  created_at: string;
}

export interface DBSubscription {
  id: string;
  user_id: string;
  platform: string;
  product_id: string;
  status: string;
  expires_at: string | null;
  receipt_data: string | null;
  created_at: string;
}
