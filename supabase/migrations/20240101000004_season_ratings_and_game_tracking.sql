-- 1. Create season_ratings table
CREATE TABLE IF NOT EXISTS season_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, media_id, season_number)
);

-- Enable RLS for season_ratings
ALTER TABLE season_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for season_ratings
CREATE POLICY "Users can manage their own season ratings"
  ON season_ratings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view season ratings"
  ON season_ratings FOR SELECT
  USING (true);

-- 2. Add columns to user_library
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS hours_played NUMERIC DEFAULT 0;
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS is_completed_100 BOOLEAN DEFAULT false;
