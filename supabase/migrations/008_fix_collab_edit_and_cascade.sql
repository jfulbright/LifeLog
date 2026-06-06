-- Fix 1: Collaborator UPDATE on items not working
-- The existing UPDATE policy has USING but no WITH CHECK.
-- PostgreSQL requires WITH CHECK to pass for the write to succeed.
-- If the base owner policy has WITH CHECK (user_id = auth.uid()),
-- it blocks non-owner writes. We need WITH CHECK (true) on our policy.

DROP POLICY IF EXISTS "collaborators_can_update_shared_entries" ON items;
DROP POLICY IF EXISTS "Collaborators can edit shared entries" ON items;

CREATE POLICY "Collaborators can edit shared entries"
  ON items FOR UPDATE
  USING (
    id IN (
      SELECT entry_id FROM collaborators
      WHERE collaborator_user_id = auth.uid()
        AND status = 'accepted'
        AND can_edit = true
    )
  )
  WITH CHECK (true);

-- Fix 2: Collaborator rows orphaned when owner deletes an item
-- Overlays already cascade (have ON DELETE CASCADE), but collaborators do not.
-- First clean up any existing orphans, then add ON DELETE CASCADE.

DELETE FROM collaborators
  WHERE entry_id NOT IN (SELECT id FROM items);

ALTER TABLE collaborators
  DROP CONSTRAINT IF EXISTS collaborators_entry_id_fkey;

ALTER TABLE collaborators
  ADD CONSTRAINT collaborators_entry_id_fkey
  FOREIGN KEY (entry_id) REFERENCES items(id) ON DELETE CASCADE;

-- Fix 3: Recommendations also reference items — add cascade
DELETE FROM recommendations
  WHERE entry_id NOT IN (SELECT id FROM items);

ALTER TABLE recommendations
  DROP CONSTRAINT IF EXISTS recommendations_entry_id_fkey;

ALTER TABLE recommendations
  ADD CONSTRAINT recommendations_entry_id_fkey
  FOREIGN KEY (entry_id) REFERENCES items(id) ON DELETE CASCADE;

-- Fix 4: Ring-based recommendations not visible due to contacts RLS
-- The existing SELECT policy subqueries contacts table, but contacts RLS
-- only allows owner_id = auth.uid(). Use SECURITY DEFINER to bypass.

CREATE OR REPLACE FUNCTION get_my_ring_recommender_ids()
RETURNS TABLE(recommender_id uuid, ring_level int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.owner_id AS recommender_id, c.ring_level
  FROM contacts c
  WHERE c.linked_user_id = auth.uid();
$$;

DROP POLICY IF EXISTS "Users can read recommendations directed to them" ON recommendations;

CREATE POLICY "Users can read recommendations directed to them"
  ON recommendations FOR SELECT USING (
    to_user_id = auth.uid()
    OR (
      to_user_id IS NULL
      AND to_ring_level IS NOT NULL
      AND (from_user_id, to_ring_level) IN (
        SELECT recommender_id, ring_level FROM get_my_ring_recommender_ids()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update recommendations directed to them" ON recommendations;

CREATE POLICY "Users can update recommendations directed to them"
  ON recommendations FOR UPDATE
  USING (
    to_user_id = auth.uid()
    OR (
      to_user_id IS NULL
      AND to_ring_level IS NOT NULL
      AND (from_user_id, to_ring_level) IN (
        SELECT recommender_id, ring_level FROM get_my_ring_recommender_ids()
      )
    )
  )
  WITH CHECK (true);
