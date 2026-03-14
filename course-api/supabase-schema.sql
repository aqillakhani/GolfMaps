-- GolfMaps Supabase Database Schema
-- Run this in your Supabase SQL Editor after creating the project

-- Profiles (auto-created on signup via trigger)
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Saved Posters
CREATE TABLE saved_posters (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  style_id TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  custom_text TEXT,
  toggles JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_posters_user ON saved_posters(user_id);
ALTER TABLE saved_posters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own posters" ON saved_posters FOR ALL USING (auth.uid() = user_id);

-- Collections (played, dream, historic)
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_type TEXT NOT NULL CHECK (collection_type IN ('played', 'dream', 'historic')),
  course_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, collection_type, course_id)
);

CREATE INDEX idx_collections_user ON collections(user_id);
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own collections" ON collections FOR ALL USING (auth.uid() = user_id);

-- Rounds (golf journal)
CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  date_played DATE NOT NULL,
  score INTEGER,
  notes TEXT,
  scorecard_photo_url TEXT,
  hole_scores JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rounds_user ON rounds(user_id);
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own rounds" ON rounds FOR ALL USING (auth.uid() = user_id);

-- Subscriptions (managed by RevenueCat webhooks)
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'stripe')),
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'grace_period')),
  expires_at TIMESTAMPTZ,
  receipt_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Only backend (service role) can insert/update subscriptions via webhook
