-- Ensure RLS is enabled
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view own game progress" ON game_progress;
DROP POLICY IF EXISTS "Users can insert own game progress" ON game_progress;
DROP POLICY IF EXISTS "Users can update own game progress" ON game_progress;
DROP POLICY IF EXISTS "Users can delete own game progress" ON game_progress;

-- Create policies
CREATE POLICY "Users can view own game progress"
  ON game_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game progress"
  ON game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game progress"
  ON game_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game progress"
  ON game_progress FOR DELETE
  USING (auth.uid() = user_id);
