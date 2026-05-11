-- ============================================================================
-- Ring Redesign + Kids Contact Attributes
-- Expands rings from 3 to 4 and adds is_child / birthday to contacts.
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ── 1. Expand ring_level constraint from 1-3 to 1-4 ─────────────────────────

ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_ring_level_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_ring_level_check
  CHECK (ring_level BETWEEN 1 AND 4);

-- ── 2. Migrate existing ring 3 (Friends) → ring 4 (Friends) ─────────────────
-- Old: 1=Inner Circle, 2=Family, 3=Friends
-- New: 1=Partner, 2=Immediate Family, 3=Extended Family, 4=Friends

UPDATE contacts SET ring_level = 4 WHERE ring_level = 3;

-- ── 3. Add is_child and birthday columns ─────────────────────────────────────

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_child BOOLEAN DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday DATE;
