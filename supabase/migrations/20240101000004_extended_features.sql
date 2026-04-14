-- Add rewatch_count and platform columns to user_library
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS rewatch_count INTEGER DEFAULT 0;
ALTER TABLE user_library ADD COLUMN IF NOT EXISTS platform TEXT;

-- Update status check constraint to include 'watch_tonight'
-- First, find the constraint name. It's usually user_library_status_check or similar.
-- We'll drop the existing one and add a new one.
ALTER TABLE user_library DROP CONSTRAINT IF EXISTS user_library_status_check;
ALTER TABLE user_library ADD CONSTRAINT user_library_status_check 
  CHECK (status IN ('planned','watching','completed','dropped','on_hold','replay', 'watch_tonight'));
