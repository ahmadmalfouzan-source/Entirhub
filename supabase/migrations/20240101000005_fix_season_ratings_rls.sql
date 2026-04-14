-- Fix RLS for season_ratings to ensure upsert works correctly
ALTER TABLE season_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own season ratings" ON season_ratings;
DROP POLICY IF EXISTS "Public can view season ratings" ON season_ratings;

CREATE POLICY "Users can view their own season ratings"
  ON season_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own season ratings"
  ON season_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own season ratings"
  ON season_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own season ratings"
  ON season_ratings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view season ratings"
  ON season_ratings FOR SELECT
  USING (true);
