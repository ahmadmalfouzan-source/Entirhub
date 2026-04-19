-- Create earned_trophies table
CREATE TABLE IF NOT EXISTS earned_trophies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    trophy_name TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, media_id, trophy_name)
);

-- Enable RLS
ALTER TABLE earned_trophies ENABLE ROW LEVEL SECURITY;

-- Policies for earned_trophies
DROP POLICY IF EXISTS "Users can view own earned trophies" ON earned_trophies;
CREATE POLICY "Users can view own earned trophies"
    ON earned_trophies FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own earned trophies" ON earned_trophies;
CREATE POLICY "Users can insert own earned trophies"
    ON earned_trophies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own earned trophies" ON earned_trophies;
CREATE POLICY "Users can update own earned trophies"
    ON earned_trophies FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own earned trophies" ON earned_trophies;
CREATE POLICY "Users can delete own earned trophies"
    ON earned_trophies FOR DELETE
    USING (auth.uid() = user_id);

-- Create game_wiki_cache table if missing (used in GameAchievementTracker)
CREATE TABLE IF NOT EXISTS game_wiki_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    wiki_type TEXT NOT NULL, -- 'trophies', 'guide', etc.
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(media_id, wiki_type)
);

-- Enable RLS for game_wiki_cache
ALTER TABLE game_wiki_cache ENABLE ROW LEVEL SECURITY;

-- Game wiki cache is public read-only, authenticated can upsert
DROP POLICY IF EXISTS "Game wiki cache is viewable by everyone" ON game_wiki_cache;
CREATE POLICY "Game wiki cache is viewable by everyone"
    ON game_wiki_cache FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage game wiki cache" ON game_wiki_cache;
CREATE POLICY "Authenticated users can manage game wiki cache"
    ON game_wiki_cache FOR ALL
    USING (auth.role() = 'authenticated');
