/*
# Apro Platform Schema

Creates the complete database schema for the Apro athlete identity and discovery platform.

## New Tables

1. `profiles` - Core user profiles shared across all roles
   - id (uuid, PK)
   - user_id (uuid, FK to auth.users, unique)
   - username (text, unique)
   - full_name (text)
   - avatar_url (text, nullable)
   - cover_url (text, nullable)
   - bio (text, nullable)
   - country (text)
   - role (text: athlete/brand/coach/agent)
   - created_at, updated_at (timestamptz)

2. `athlete_profiles` - Extended profile for athletes only
   - id (uuid, PK)
   - profile_id (uuid, FK to profiles)
   - sport (text)
   - position (text)
   - date_of_birth (date, nullable)
   - availability (text: available/unavailable/open_to_offers, default available)

3. `highlights` - Video highlight uploads
   - id (uuid, PK)
   - profile_id (uuid, FK to profiles)
   - title (text)
   - description (text, nullable)
   - video_url (text)
   - thumbnail_url (text, nullable)
   - sport (text)
   - created_at (timestamptz)

4. `stats` - Season statistics for athletes
   - id (uuid, PK)
   - athlete_profile_id (uuid, FK to athlete_profiles)
   - season (text)
   - appearances (int, default 0)
   - goals (int, default 0)
   - assists (int, default 0)
   - clean_sheets (int, nullable)
   - minutes_played (int, default 0)

5. `achievements` - Career achievements/milestones
   - id (uuid, PK)
   - profile_id (uuid, FK to profiles)
   - title (text)
   - description (text)
   - date (date)
   - icon (text, nullable)
   - created_at (timestamptz)

6. `profile_views` - Profile view tracking
   - id (uuid, PK)
   - profile_id (uuid, FK to profiles)
   - viewer_id (uuid, nullable - null for anonymous)
   - created_at (timestamptz)

7. `follows` - Follow relationships
   - id (uuid, PK)
   - follower_id (uuid, FK to profiles)
   - following_id (uuid, FK to profiles)
   - created_at (timestamptz)
   - Unique constraint on (follower_id, following_id)

## Security (RLS)

- All tables have RLS enabled.
- `profiles`: anyone can read (public profiles for sharing), users can update own profile, users can insert own profile.
- `athlete_profiles`: anyone can read, owner can insert/update own.
- `highlights`: anyone can read, owner can insert/update/delete own.
- `stats`: anyone can read, owner can insert/update/delete own (scoped through athlete_profiles).
- `achievements`: anyone can read, owner can insert/update/delete own.
- `profile_views`: anyone can insert (for tracking), owner can read views of own profile.
- `follows`: anyone can read, authenticated can insert/delete own follows.

## Important Notes

1. Public profile pages work without login because SELECT policies allow anon access.
2. user_id on profiles defaults to auth.uid() so inserts omitting it still succeed.
3. Follows uses profile IDs (not user_ids) to allow brand/coach following athletes.
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  cover_url text,
  bio text,
  country text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'brand', 'coach', 'agent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
CREATE POLICY "profiles_public_select" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Athlete Profiles
CREATE TABLE IF NOT EXISTS athlete_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  sport text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  date_of_birth date,
  availability text NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'unavailable', 'open_to_offers'))
);

ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "athlete_profiles_public_select" ON athlete_profiles;
CREATE POLICY "athlete_profiles_public_select" ON athlete_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "athlete_profiles_insert_own" ON athlete_profiles;
CREATE POLICY "athlete_profiles_insert_own" ON athlete_profiles FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = athlete_profiles.profile_id AND profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "athlete_profiles_update_own" ON athlete_profiles;
CREATE POLICY "athlete_profiles_update_own" ON athlete_profiles FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = athlete_profiles.profile_id AND profiles.user_id = auth.uid())
  );

-- Highlights
CREATE TABLE IF NOT EXISTS highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text NOT NULL DEFAULT '',
  thumbnail_url text,
  sport text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "highlights_public_select" ON highlights;
CREATE POLICY "highlights_public_select" ON highlights FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "highlights_insert_own" ON highlights;
CREATE POLICY "highlights_insert_own" ON highlights FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = highlights.profile_id AND profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "highlights_update_own" ON highlights;
CREATE POLICY "highlights_update_own" ON highlights FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = highlights.profile_id AND profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "highlights_delete_own" ON highlights;
CREATE POLICY "highlights_delete_own" ON highlights FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = highlights.profile_id AND profiles.user_id = auth.uid())
  );

-- Stats
CREATE TABLE IF NOT EXISTS stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_profile_id uuid NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  season text NOT NULL DEFAULT '',
  appearances int NOT NULL DEFAULT 0,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  clean_sheets int,
  minutes_played int NOT NULL DEFAULT 0
);

ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stats_public_select" ON stats;
CREATE POLICY "stats_public_select" ON stats FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "stats_insert_own" ON stats;
CREATE POLICY "stats_insert_own" ON stats FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM athlete_profiles ap
      JOIN profiles p ON p.id = ap.profile_id
      WHERE ap.id = stats.athlete_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "stats_update_own" ON stats;
CREATE POLICY "stats_update_own" ON stats FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM athlete_profiles ap
      JOIN profiles p ON p.id = ap.profile_id
      WHERE ap.id = stats.athlete_profile_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "stats_delete_own" ON stats;
CREATE POLICY "stats_delete_own" ON stats FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM athlete_profiles ap
      JOIN profiles p ON p.id = ap.profile_id
      WHERE ap.id = stats.athlete_profile_id AND p.user_id = auth.uid()
    )
  );

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  date date NOT NULL,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_public_select" ON achievements;
CREATE POLICY "achievements_public_select" ON achievements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "achievements_insert_own" ON achievements;
CREATE POLICY "achievements_insert_own" ON achievements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = achievements.profile_id AND profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "achievements_update_own" ON achievements;
CREATE POLICY "achievements_update_own" ON achievements FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = achievements.profile_id AND profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "achievements_delete_own" ON achievements;
CREATE POLICY "achievements_delete_own" ON achievements FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = achievements.profile_id AND profiles.user_id = auth.uid())
  );

-- Profile Views
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_views_insert_any" ON profile_views;
CREATE POLICY "profile_views_insert_any" ON profile_views FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profile_views_select_own" ON profile_views;
CREATE POLICY "profile_views_select_own" ON profile_views FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = profile_views.profile_id AND profiles.user_id = auth.uid())
  );

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_public_select" ON follows;
CREATE POLICY "follows_public_select" ON follows FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = follows.follower_id AND profiles.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own" ON follows FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = follows.follower_id AND profiles.user_id = auth.uid())
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_profile_id ON highlights(profile_id);
CREATE INDEX IF NOT EXISTS idx_achievements_profile_id ON achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_highlights_created_at ON highlights(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
