-- 016_soft_hide_restore.sql
--
-- Epic B / B3 — Leave / Remove with restore (#2.3, #10.1).
--
-- Removing a person must be SOFT-HIDE, never hard-delete, and fully restorable.
-- Decisions: hide is RECIPROCAL (both sides lose the shared collabs/recs — but
-- each keeps their OWN base entries), and restore is IMMEDIATE on "Add back"
-- (the remover alone can bring it back).
--
-- MECHANISM: a `revoked_at` timestamp instead of overloading status='declined'.
-- get_my_collaborations() (the single resolver behind every collaborator-
-- dependent RLS policy, the shared feed, the pending counts, and B1's reveal)
-- filters `revoked_at IS NULL`, so a revoked collaboration disappears everywhere
-- for BOTH users while `status` is preserved for a perfect restore.

-- ── 1. Soft-state columns (default NULL → existing rows unaffected) ────────────
ALTER TABLE contacts        ADD COLUMN IF NOT EXISTS removed_at timestamptz;
ALTER TABLE collaborators   ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- ── 2. Re-create the resolver to exclude revoked collaborations ───────────────
-- Body copied verbatim from migration 010, plus `AND co.revoked_at IS NULL`.
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
  WHERE co.revoked_at IS NULL
    AND (
      co.collaborator_user_id = auth.uid()
      OR co.collaborator_contact_id IN (
           SELECT c.id
           FROM contacts c
           WHERE normalize_email(c.email) = (
             SELECT normalize_email(u.email) FROM auth.users u WHERE u.id = auth.uid()
           )
         )
    );
$$;

-- ── 3. Hide everything shared between me and one person (reciprocal) ───────────
-- Only ever touches rows where auth.uid() is one side of the pair, so a caller
-- cannot revoke collaborations they are not part of.
CREATE OR REPLACE FUNCTION hide_shared_with_person(p_other_user uuid, p_contact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Collaborations in both directions (I shared with them / they shared with me).
  UPDATE collaborators
  SET revoked_at = now()
  WHERE revoked_at IS NULL
    AND (
      (owner_id = auth.uid() AND (collaborator_user_id = p_other_user OR collaborator_contact_id = p_contact_id))
      OR (owner_id = p_other_user AND collaborator_user_id = auth.uid())
    );

  -- Person-to-person recommendations in both directions (ring broadcasts excluded).
  UPDATE recommendations
  SET revoked_at = now()
  WHERE revoked_at IS NULL
    AND (
      (from_user_id = auth.uid() AND to_user_id = p_other_user)
      OR (from_user_id = p_other_user AND to_user_id = auth.uid())
    );

  -- Soft-archive my own contact for them.
  UPDATE contacts
  SET removed_at = now()
  WHERE id = p_contact_id AND owner_id = auth.uid();
END;
$$;

-- ── 4. Restore everything shared between me and one person ─────────────────────
CREATE OR REPLACE FUNCTION restore_shared_with_person(p_other_user uuid, p_contact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE collaborators
  SET revoked_at = NULL
  WHERE revoked_at IS NOT NULL
    AND (
      (owner_id = auth.uid() AND (collaborator_user_id = p_other_user OR collaborator_contact_id = p_contact_id))
      OR (owner_id = p_other_user AND collaborator_user_id = auth.uid())
    );

  UPDATE recommendations
  SET revoked_at = NULL
  WHERE revoked_at IS NOT NULL
    AND (
      (from_user_id = auth.uid() AND to_user_id = p_other_user)
      OR (from_user_id = p_other_user AND to_user_id = auth.uid())
    );

  UPDATE contacts
  SET removed_at = NULL
  WHERE id = p_contact_id AND owner_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION hide_shared_with_person(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION restore_shared_with_person(uuid, uuid) TO authenticated;
