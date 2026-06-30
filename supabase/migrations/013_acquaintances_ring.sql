-- ============================================================================
-- Acquaintances Ring (level 5)
-- Adds a fifth sharing ring for casual contacts (#2.7, Epic A / A3).
-- Run this in Supabase Dashboard > SQL Editor.
--
-- Notes:
-- * The visibility RLS (migration 011) gates reads with an array-contains check
--   ((items.data -> 'visibilityRings') @> to_jsonb(ring_level)), which is
--   level-agnostic — no RLS change is needed to support ring 5.
-- * The only DB-side constraint on ring level is the CHECK on contacts.ring_level,
--   last set to 1..4 in migration 002. We widen it to 1..5 here.
-- ============================================================================

-- ── Expand ring_level constraint from 1-4 to 1-5 ────────────────────────────

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_ring_level_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_ring_level_check
  CHECK (ring_level BETWEEN 1 AND 5);
