-- Allow collaborators to see all peer rows on entries they share,
-- and owners to see all collaborator rows on their entries.
-- Previous policy only let users see their own row.
--
-- Uses a SECURITY DEFINER function to avoid RLS recursion when
-- the policy subqueries the same table.

DROP POLICY IF EXISTS "Collaborators can read their rows" ON collaborators;
DROP POLICY IF EXISTS "Collaborators can read peer rows" ON collaborators;

CREATE OR REPLACE FUNCTION get_my_shared_entry_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT entry_id FROM collaborators
  WHERE collaborator_user_id = auth.uid() AND status = 'accepted';
$$;

CREATE POLICY "Collaborators can read peer rows"
  ON collaborators FOR SELECT USING (
    collaborator_user_id = auth.uid()
    OR owner_id = auth.uid()
    OR entry_id IN (SELECT get_my_shared_entry_ids())
  );

-- Prevent duplicate collaborator rows per entry+contact and entry+user
CREATE UNIQUE INDEX IF NOT EXISTS collaborators_entry_contact_unique
  ON collaborators (entry_id, collaborator_contact_id)
  WHERE collaborator_contact_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS collaborators_entry_user_unique
  ON collaborators (entry_id, collaborator_user_id)
  WHERE collaborator_user_id IS NOT NULL;
