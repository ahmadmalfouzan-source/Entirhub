-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM for content types
CREATE TYPE content_type AS ENUM ('game', 'movie', 'series');

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    preferences_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTENT ITEMS TABLE
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type content_type NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    genres JSONB DEFAULT '[]'::jsonb,
    rating FLOAT,
    cover_url TEXT,
    release_date DATE,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    cached_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(type, external_id)
);

-- USER TRACKING TABLE
CREATE TABLE user_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- e.g., 'playing', 'completed', 'dropped', 'want_to_play'
    progress_json JSONB DEFAULT '{}'::jsonb, -- e.g., { "hours": 10, "completion": 50 } or { "season": 1, "episode": 5 }
    personal_rating INT CHECK (personal_rating >= 1 AND personal_rating <= 5),
    notes TEXT,
    favorited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- GAME WIKI TABLE
CREATE TABLE game_wiki (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    section_name TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(game_content_id, section_name)
);

-- RECOMMENDATIONS TABLE
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    reason_text TEXT NOT NULL,
    score FLOAT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- INDEXES
CREATE INDEX idx_content_items_type ON content_items(type);
CREATE INDEX idx_user_tracking_user_id ON user_tracking(user_id);
CREATE INDEX idx_user_tracking_content_id ON user_tracking(content_id);
CREATE INDEX idx_game_wiki_game_content_id ON game_wiki(game_content_id);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);

-- RLS POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_wiki ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile and update it
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Content items are public read-only
CREATE POLICY "Content items are public" ON content_items FOR SELECT USING (true);

-- User tracking is private to the user
CREATE POLICY "Users can view their own tracking" ON user_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tracking" ON user_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tracking" ON user_tracking FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tracking" ON user_tracking FOR DELETE USING (auth.uid() = user_id);

-- Game wiki is public read-only
CREATE POLICY "Game wiki is public" ON game_wiki FOR SELECT USING (true);

-- Recommendations are private to the user
CREATE POLICY "Users can view their own recommendations" ON recommendations FOR SELECT USING (auth.uid() = user_id);
