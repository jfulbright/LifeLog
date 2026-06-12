-- 009_recommended_entries_any_status.sql
--
-- Recipients can read an entry that was recommended to them regardless of the
-- recommendation's status. Previously (migration 006) the items SELECT policy
-- restricted this to status = 'active', so once a recipient accepted or declined
-- a recommendation they lost the ability to read the recommender's entry. That
-- made the Accepted/Declined tabs on the Recommendations page render empty for
-- cross-user recommendations (the page could no longer fetch the entry's title,
-- snapshot, rating, or poster).
--
-- Broadening to any status is safe: the recipient was explicitly recommended the
-- entry, so read access does not depend on whether they have acted on it yet.

DROP POLICY IF EXISTS "Recipients can read recommended entries" ON items;

CREATE POLICY "Recipients can read recommended entries" ON items FOR SELECT USING (
  id IN (
    SELECT entry_id FROM recommendations
    WHERE to_user_id = auth.uid()
  )
);
