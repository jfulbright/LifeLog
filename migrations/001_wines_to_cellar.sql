-- Cellar Migration: Rename wines -> cellar and add subType field
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Update all existing wine entries: rename category and add subType
UPDATE items
SET
  category = 'cellar',
  data = jsonb_set(data, '{subType}', '"wine"')
WHERE category = 'wines';

-- 2. Verify the migration
SELECT category, data->>'subType' as sub_type, count(*)
FROM items
WHERE category = 'cellar'
GROUP BY category, data->>'subType';
