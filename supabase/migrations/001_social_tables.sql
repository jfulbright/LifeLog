-- ============================================================================
-- LifeSnaps Social Tables Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ── 1. Profiles ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 140),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Profiles of linked contacts are readable
CREATE POLICY "Users can read linked profiles"
  ON profiles FOR SELECT USING (
    id IN (
      SELECT linked_user_id FROM contacts
      WHERE owner_id = auth.uid() AND linked_user_id IS NOT NULL
    )
  );

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 2. Contacts ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  ring_level INT NOT NULL DEFAULT 3 CHECK (ring_level BETWEEN 1 AND 3),
  invite_status TEXT DEFAULT 'local_only'
    CHECK (invite_status IN ('local_only', 'invited', 'accepted', 'declined')),
  linked_user_id UUID REFERENCES auth.users(id),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, email)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts"
  ON contacts FOR ALL USING (owner_id = auth.uid());

-- ── 3. Invites ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  message TEXT,
  shared_entry_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invites"
  ON invites FOR ALL USING (inviter_id = auth.uid());

CREATE POLICY "Anyone can read invite by token"
  ON invites FOR SELECT USING (true);

-- Auto-link on signup: when a new user's email matches a pending invite
CREATE OR REPLACE FUNCTION handle_invite_auto_link()
RETURNS TRIGGER AS $$
BEGIN
  -- Update matching invites
  UPDATE invites
  SET status = 'accepted', accepted_at = now()
  WHERE invitee_email = NEW.email AND status = 'pending';

  -- Link the contact records
  UPDATE contacts
  SET linked_user_id = NEW.id, invite_status = 'accepted'
  WHERE email = NEW.email AND linked_user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_invite_auto_link();

-- ── 4. Collaborators ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL,
  entry_category TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  collaborator_user_id UUID REFERENCES auth.users(id),
  collaborator_contact_id UUID,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  can_edit BOOLEAN DEFAULT true,
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entry owners can manage collaborators"
  ON collaborators FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Collaborators can read and update their own rows"
  ON collaborators FOR SELECT USING (collaborator_user_id = auth.uid());

CREATE POLICY "Collaborators can update status"
  ON collaborators FOR UPDATE USING (collaborator_user_id = auth.uid());

-- ── 5. Overlays (personal Snapshots per collaborator per entry) ──────────────

CREATE TABLE IF NOT EXISTS overlays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  snapshot1 TEXT CHECK (char_length(snapshot1) <= 140),
  snapshot2 TEXT CHECK (char_length(snapshot2) <= 140),
  snapshot3 TEXT CHECK (char_length(snapshot3) <= 140),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

ALTER TABLE overlays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own overlays"
  ON overlays FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Collaborators can view overlays on shared entries"
  ON overlays FOR SELECT USING (
    entry_id IN (
      SELECT entry_id FROM collaborators
      WHERE collaborator_user_id = auth.uid() AND status = 'accepted'
    )
    OR
    entry_id IN (
      SELECT id FROM items WHERE user_id = auth.uid()
    )
  );

-- ── 6. Recommendations ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  entry_id UUID NOT NULL,
  entry_category TEXT NOT NULL,
  to_user_id UUID REFERENCES auth.users(id),
  to_ring_level INT,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'accepted', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own recommendations"
  ON recommendations FOR ALL USING (from_user_id = auth.uid());

CREATE POLICY "Users can read recommendations directed to them"
  ON recommendations FOR SELECT USING (to_user_id = auth.uid());

CREATE POLICY "Users can update recommendations directed to them"
  ON recommendations FOR UPDATE USING (to_user_id = auth.uid());

-- ── 7. Storage bucket for avatars ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ── 8. Create profile for existing users ─────────────────────────────────────
-- Run this once to backfill profiles for users who signed up before the trigger

INSERT INTO profiles (id, display_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
