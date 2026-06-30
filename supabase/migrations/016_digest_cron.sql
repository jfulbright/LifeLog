-- ============================================================================
-- Weekly digest schedule (pg_cron + pg_net)
-- ============================================================================
-- Schedules the `weekly-digest` Edge Function once a week. Secrets are NOT
-- hardcoded — they're read from Supabase Vault, so this migration is safe to
-- commit. Before (or after) running it, store the two secrets once:
--
--   select vault.create_secret(
--     'https://<PROJECT_REF>.functions.supabase.co/weekly-digest', 'digest_function_url');
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'digest_service_role_key');
--
-- (Re-running create_secret with an existing name errors; use vault.update_secret.)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotent (re)schedule: drop any prior job with this name first.
SELECT cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'weekly-digest';

-- Sunday 16:00 UTC. Adjust the cron expression to taste.
SELECT cron.schedule(
  'weekly-digest',
  '0 16 * * 0',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'digest_function_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'digest_service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
