-- ============================================================================
-- Auto-link contacts to existing users + backfill
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ── 1. Trigger: auto-link contact on INSERT if user already exists ───────────

CREATE OR REPLACE FUNCTION link_contact_if_user_exists()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = NEW.email
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    NEW.linked_user_id := existing_user_id;
    NEW.invite_status := 'accepted';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_contact_created_link ON contacts;
CREATE TRIGGER on_contact_created_link
  BEFORE INSERT ON contacts
  FOR EACH ROW EXECUTE FUNCTION link_contact_if_user_exists();

-- ── 2. Backfill: link any existing contacts whose emails match existing users ─

UPDATE contacts c
SET linked_user_id = u.id, invite_status = 'accepted'
FROM auth.users u
WHERE c.email = u.email
  AND c.linked_user_id IS NULL;

-- ── 3. Add notification_preferences column to profiles ────────────────────────

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "collab_request_email": false,
  "collab_snaps_inapp": true,
  "collab_snaps_email": false,
  "recommendation_email": false,
  "invite_accepted_email": false
}'::jsonb;
