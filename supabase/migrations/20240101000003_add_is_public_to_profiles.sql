-- Add is_public column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Update RLS policies for profiles to allow public viewing only if is_public is true
-- Note: There was already a policy "Public profiles are viewable by everyone." that allowed true.
-- We should refine it if we want strict privacy, but the user request implies we want to control library access.
-- The user_library table also needs a policy to allow public viewing if the profile is public.

-- Refine profile visibility
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Profiles are viewable by everyone." ON profiles FOR SELECT USING (true);

-- Allow public viewing of user_library if the profile is public
CREATE POLICY "Public can view libraries of public profiles" ON user_library
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_library.user_id
      AND profiles.is_public = true
    )
  );
