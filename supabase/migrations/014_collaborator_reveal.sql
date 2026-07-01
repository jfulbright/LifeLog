-- 014_collaborator_reveal.sql
--
-- Epic B / B1 — Shared-entry co-presence reveal (#2.4 + #2.5).
--
-- PROBLEM: on an entry you can see, the collaborators peer-row RLS already lets
-- you read peer `collaborators` rows, but the `profiles` SELECT policy only
-- exposes the profiles of your OWN linked contacts. So a co-collaborator you are
-- not connected to comes back with a NULL name and renders as "Collaborator".
--
-- FIX: a SECURITY DEFINER reader that returns NAME + AVATAR ONLY (never email or
-- bio) for every participant on an entry — but ONLY when the caller is themselves
-- a participant on that entry (owner, or a pending/accepted collaborator). The
-- shared entry is the consent surface: anyone on a trip you can see is fair to
-- name, regardless of who invited them. Profiles/snaps stay gated behind an
-- actual connection (handled separately by the connection handshake).

CREATE OR REPLACE FUNCTION get_entry_collaborator_profiles(p_entry_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  is_owner boolean,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH participant AS (
    SELECT (
      EXISTS (
        SELECT 1 FROM items i WHERE i.id = p_entry_id AND i.user_id = auth.uid()
      )
      OR p_entry_id IN (
        SELECT entry_id FROM get_my_collaborations() WHERE status IN ('pending', 'accepted')
      )
    ) AS ok
  )
  -- Owner of the entry.
  SELECT i.user_id, p.display_name, p.avatar_url, true AS is_owner, 'accepted'::text AS status
  FROM items i
  JOIN profiles p ON p.id = i.user_id
  WHERE i.id = p_entry_id
    AND (SELECT ok FROM participant)

  UNION

  -- Collaborators with a resolved account.
  SELECT co.collaborator_user_id, p.display_name, p.avatar_url, false AS is_owner, co.status
  FROM collaborators co
  JOIN profiles p ON p.id = co.collaborator_user_id
  WHERE co.entry_id = p_entry_id
    AND co.collaborator_user_id IS NOT NULL
    AND co.status IN ('pending', 'accepted')
    AND (SELECT ok FROM participant);
$$;

GRANT EXECUTE ON FUNCTION get_entry_collaborator_profiles(uuid) TO authenticated;
