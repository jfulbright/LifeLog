-- Rename purchaseDate → startDate and soldDate → endDate in home items
-- so that home records are timeline-compatible (sorted by data->>'startDate').
UPDATE items
SET data = jsonb_set(
  jsonb_set(data - 'purchaseDate', '{startDate}', data->'purchaseDate'),
  '{endDate}', data->'soldDate'
) - 'soldDate'
WHERE category = 'homes'
  AND (data ? 'purchaseDate' OR data ? 'soldDate');
