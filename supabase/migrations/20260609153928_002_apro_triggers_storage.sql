/*
# Auto-create profile on signup + Storage setup

1. Creates a trigger function that auto-inserts a profiles row when a new user signs up.
   - Generates a username from the user's email prefix + random number
   - Uses the full_name from user metadata if provided
   - Also creates an athlete_profiles row if role is 'athlete'

2. Creates storage buckets for avatars, covers, and highlights videos.
*/

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username text;
  new_role text;
  new_full_name text;
  new_profile_id uuid;
BEGIN
  new_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
  new_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  new_username := lower(regexp_replace(new_full_name, '[^a-z0-9]', '', 'g')) || floor(random() * 999)::text;

  -- Ensure username uniqueness
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = new_username) LOOP
    new_username := lower(regexp_replace(new_full_name, '[^a-z0-9]', '', 'g')) || floor(random() * 9999)::text;
  END LOOP;

  INSERT INTO profiles (user_id, username, full_name, country, role)
  VALUES (
    NEW.id,
    new_username,
    new_full_name,
    COALESCE(NEW.raw_user_meta_data->>'country', ''),
    new_role
  )
  RETURNING id INTO new_profile_id;

  -- Create athlete profile if role is athlete
  IF new_role = 'athlete' THEN
    INSERT INTO athlete_profiles (profile_id, sport, position, date_of_birth)
    VALUES (
      new_profile_id,
      COALESCE(NEW.raw_user_meta_data->>'sport', ''),
      COALESCE(NEW.raw_user_meta_data->>'position', ''),
      COALESCE((NEW.raw_user_meta_data->>'date_of_birth')::date, NULL)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert storage buckets (using do block for idempotency)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'covers') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'highlights') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('highlights', 'highlights', true);
  END IF;
END $$;

-- Storage policies for avatars
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'avatars');

-- Storage policies for covers
DROP POLICY IF EXISTS "covers_upload_own" ON storage.objects;
CREATE POLICY "covers_upload_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "covers_update_own" ON storage.objects;
CREATE POLICY "covers_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'covers' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "covers_public_read" ON storage.objects;
CREATE POLICY "covers_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'covers');

-- Storage policies for highlights
DROP POLICY IF EXISTS "highlights_upload_own" ON storage.objects;
CREATE POLICY "highlights_upload_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'highlights' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "highlights_update_own" ON storage.objects;
CREATE POLICY "highlights_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'highlights' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "highlights_public_read" ON storage.objects;
CREATE POLICY "highlights_public_read" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'highlights');
