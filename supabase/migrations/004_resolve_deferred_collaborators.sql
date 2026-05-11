-- ============================================================================
-- Enhance auto-link trigger to resolve deferred collaborator rows
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Replace the existing auto-link function with an enhanced version
-- that also resolves collaborator rows when a new user signs up.

CREATE OR REPLACE FUNCTION handle_invite_auto_link()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Update matching invites to accepted
  UPDATE invites
  SET status = 'accepted', accepted_at = now()
  WHERE invitee_email = NEW.email AND status = 'pending';

  -- 2. Link the contact records (across all users who added this email)
  UPDATE contacts
  SET linked_user_id = NEW.id, invite_status = 'accepted'
  WHERE email = NEW.email AND linked_user_id IS NULL;

  -- 3. Resolve deferred collaborator rows:
  --    Any collaborator rows that were created with collaborator_contact_id
  --    (but no collaborator_user_id) now get the user_id filled in.
  UPDATE collaborators co
  SET collaborator_user_id = NEW.id
  FROM contacts c
  WHERE c.email = NEW.email
    AND c.linked_user_id = NEW.id
    AND co.collaborator_contact_id = c.id
    AND co.collaborator_user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger itself doesn't need to be recreated (it already exists),
-- but let's ensure it's there.
DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_invite_auto_link();
