-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'series', 'game')),
  status TEXT NOT NULL CHECK (status IN ('watching', 'completed', 'planned')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  title TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, media_id)
);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own watchlist" 
  ON watchlist FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watchlist" 
  ON watchlist FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist" 
  ON watchlist FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist" 
  ON watchlist FOR DELETE 
  USING (auth.uid() = user_id);
