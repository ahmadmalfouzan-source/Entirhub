-- Ensure RLS is enabled
ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_quests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view own game progress" ON game_progress;
DROP POLICY IF EXISTS "Users can insert own game progress" ON game_progress;
DROP POLICY IF EXISTS "Users can update own game progress" ON game_progress;
DROP POLICY IF EXISTS "Users can delete own game progress" ON game_progress;

DROP POLICY IF EXISTS "Users can view own game quests" ON game_quests;
DROP POLICY IF EXISTS "Users can insert own game quests" ON game_quests;
DROP POLICY IF EXISTS "Users can update own game quests" ON game_quests;
DROP POLICY IF EXISTS "Users can delete own game quests" ON game_quests;

-- Create policies for game_progress
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

-- Create policies for game_quests
CREATE POLICY "Users can view own game quests"
  ON game_quests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game quests"
  ON game_quests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game quests"
  ON game_quests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own game quests"
  ON game_quests FOR DELETE
  USING (auth.uid() = user_id);
