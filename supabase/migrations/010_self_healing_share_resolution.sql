-- 010_self_healing_share_resolution.sql
--
-- Makes collaboration visibility self-healing instead of depending on a single
-- one-shot signup trigger (migration 004) that, if it never fired (un-applied
-- migration, OAuth path, email mismatch), left the invitee permanently unable to
-- see the shared entry.
--
-- ROOT CAUSE this fixes:
--   When you share with someone who has NOT signed up yet, the collaborators row
--   is written with collaborator_user_id = NULL (only collaborator_contact_id is
--   set). Every collaborator RLS policy keyed strictly on
--   collaborator_user_id = auth.uid(), so a NULL row granted ZERO visibility until
--   something back-filled the user id. The only back-fill was the auth.users
--   signup trigger -- a fragile, hand-applied, exact-email-match dependency.
--
-- NEW MODEL (two layers, both correct independently):
--   1. READ-TIME RESOLUTION (safety net): a single SECURITY DEFINER source of
--      truth, get_my_collaborations(), resolves a collaborator row to the current
--      user by collaborator_user_id OR by normalized email (collaborator_contact_id
--      -> contacts.email == my auth email). Every collaborator-dependent policy
--      now uses it, so an invite becomes visible the moment the invitee's email
--      exists -- regardless of signup order or whether any trigger ran.
--   2. SELF-HEALING BACKFILL (fast path): resolve_my_collaborations(), called by
--      the app on every login, links the caller's contacts and back-fills their
--      collaborator rows. Independent of the signup trigger.
--   The signup trigger is kept as a best-effort optimization, now using the same
--   normalized-email matching.

-- ── 0. Email normalization ───────────────────────────────────────────────────
-- Account identity, not inbox identity:
--   * lower + trim
--   * Gmail/Googlemail: strip dots in the local part (Google ignores dots for
--     account identity -> madison.fulbright == madisonfulbright), normalize the
--     googlemail.com domain to gmail.com.
--   * KEEP the +suffix. A real Google OAuth email never contains '+', and our
--     email/password test accounts (jfulbright+user1/2/3@gmail.com) rely on the
--     +suffix to stay distinct app accounts that happen to share one inbox.
CREATE OR REPLACE FUNCTION normalize_email(addr text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN addr IS NULL OR position('@' in addr) = 0
      THEN lower(trim(coalesce(addr, '')))
    ELSE (
      SELECT
        CASE WHEN dom IN ('gmail.com', 'googlemail.com')
             THEN replace(loc, '.', '')
             ELSE loc
        END
        || '@' ||
        CASE WHEN dom = 'googlemail.com' THEN 'gmail.com' ELSE dom END
      FROM (
        SELECT lower(trim(split_part(addr, '@', 1))) AS loc,
               lower(trim(split_part(addr, '@', 2))) AS dom
      ) p
    )
  END;
$$;

-- ── 1. Source of truth: my collaborations (resolved by user_id OR email) ───────
-- SECURITY DEFINER so it can read contacts + auth.users across owners without
-- tripping their RLS, and so policies that reference collaborators don't recurse.
CREATE OR REPLACE FUNCTION get_my_collaborations()
RETURNS TABLE(
  collaborator_id uuid,
  entry_id uuid,
  entry_category text,
  owner_id uuid,
  status text,
  can_edit boolean,
  invited_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT co.id, co.entry_id, co.entry_category, co.owner_id, co.status, co.can_edit, co.invited_at
  FROM collaborators co
  WHERE co.collaborator_user_id = auth.uid()
     OR co.collaborator_contact_id IN (
          SELECT c.id
          FROM contacts c
          WHERE normalize_email(c.email) = (
            SELECT normalize_email(u.email) FROM auth.users u WHERE u.id = auth.uid()
          )
        );
$$;

-- Keep the legacy helper (used by the collaborators peer-row policy) consistent
-- by delegating to the new source of truth.
CREATE OR REPLACE FUNCTION get_my_shared_entry_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entry_id FROM get_my_collaborations() WHERE status = 'accepted';
$$;

-- ── 2. Self-healing backfill, called by the app on login ───────────────────────
-- Only ever assigns the CALLER's own user id to rows matching the CALLER's own
-- (provider-verified) email, so it cannot be used to claim another account.
CREATE OR REPLACE FUNCTION resolve_my_collaborations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  my_email text;
BEGIN
  SELECT normalize_email(email) INTO my_email FROM auth.users WHERE id = auth.uid();
  IF my_email IS NULL THEN
    RETURN;
  END IF;

  -- Link my contact records across every owner who added my email.
  UPDATE contacts
  SET linked_user_id = auth.uid(), invite_status = 'accepted'
  WHERE linked_user_id IS NULL
    AND normalize_email(email) = my_email;

  -- Back-fill deferred collaborator rows that pointed at my contact.
  UPDATE collaborators co
  SET collaborator_user_id = auth.uid()
  FROM contacts c
  WHERE co.collaborator_contact_id = c.id
    AND co.collaborator_user_id IS NULL
    AND normalize_email(c.email) = my_email;
END;
$$;

-- ── 3. Rewrite every collaborator-dependent policy to use the resolver ─────────

-- items: collaborators can READ pending+accepted shares (pending so they show in
-- the SharedFeed inbox; the main category list filters to accepted client-side).
DROP POLICY IF EXISTS "Collaborators can read shared entries" ON items;
CREATE POLICY "Collaborators can read shared entries" ON items FOR SELECT USING (
  id IN (SELECT entry_id FROM get_my_collaborations() WHERE status IN ('pending', 'accepted'))
);

-- items: collaborators can EDIT accepted shares with can_edit.
DROP POLICY IF EXISTS "Collaborators can edit shared entries" ON items;
DROP POLICY IF EXISTS "collaborators_can_update_shared_entries" ON items;
CREATE POLICY "Collaborators can edit shared entries" ON items FOR UPDATE
  USING (
    id IN (SELECT entry_id FROM get_my_collaborations() WHERE status = 'accepted' AND can_edit)
  )
  WITH CHECK (true);

-- collaborators: invitee sees their own row (by user_id OR email) so they can
-- accept a deferred invite; owner sees all; peers see each other on shared entries.
DROP POLICY IF EXISTS "Collaborators can read peer rows" ON collaborators;
DROP POLICY IF EXISTS "Collaborators can read their rows" ON collaborators;
DROP POLICY IF EXISTS "Collaborators can read and update their own rows" ON collaborators;
CREATE POLICY "Collaborators can read peer rows" ON collaborators FOR SELECT USING (
  owner_id = auth.uid()
  OR id IN (SELECT collaborator_id FROM get_my_collaborations())
  OR entry_id IN (SELECT entry_id FROM get_my_collaborations() WHERE status = 'accepted')
);

-- collaborators: invitee can update their own row (accept/decline), resolved by
-- email too so a deferred invitee can act before the backfill runs.
DROP POLICY IF EXISTS "Collaborators can update status" ON collaborators;
CREATE POLICY "Collaborators can update status" ON collaborators FOR UPDATE
  USING (id IN (SELECT collaborator_id FROM get_my_collaborations()))
  WITH CHECK (true);

-- overlays: collaborators (resolved) can view peer overlays on accepted shares.
DROP POLICY IF EXISTS "Collaborators can view overlays on shared entries" ON overlays;
CREATE POLICY "Collaborators can view overlays on shared entries" ON overlays FOR SELECT USING (
  entry_id IN (SELECT entry_id FROM get_my_collaborations() WHERE status = 'accepted')
  OR entry_id IN (SELECT id FROM items WHERE user_id = auth.uid())
);

-- ── 4. Re-apply the signup trigger with normalized matching (best-effort) ──────
CREATE OR REPLACE FUNCTION handle_invite_auto_link()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE invites
  SET status = 'accepted', accepted_at = now()
  WHERE normalize_email(invitee_email) = normalize_email(NEW.email) AND status = 'pending';

  UPDATE contacts
  SET linked_user_id = NEW.id, invite_status = 'accepted'
  WHERE normalize_email(email) = normalize_email(NEW.email) AND linked_user_id IS NULL;

  UPDATE collaborators co
  SET collaborator_user_id = NEW.id
  FROM contacts c
  WHERE co.collaborator_contact_id = c.id
    AND co.collaborator_user_id IS NULL
    AND normalize_email(c.email) = normalize_email(NEW.email);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_link ON auth.users;
CREATE TRIGGER on_auth_user_created_link
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_invite_auto_link();

-- The reverse path (user already exists, then you add them as a contact) had the
-- same exact-email blindness. Normalize it too so adding "madison.fulbright@..."
-- links to an existing "madisonfulbright@..." account.
CREATE OR REPLACE FUNCTION link_contact_if_user_exists()
RETURNS TRIGGER AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE normalize_email(email) = normalize_email(NEW.email)
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

-- ── 5. Grants (RLS evaluates these as the querying role) ───────────────────────
GRANT EXECUTE ON FUNCTION normalize_email(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_my_collaborations() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_my_shared_entry_ids() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION resolve_my_collaborations() TO authenticated;
