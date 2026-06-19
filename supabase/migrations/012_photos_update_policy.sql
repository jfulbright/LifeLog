-- ============================================================================
-- 012 — Photos storage UPDATE policy
-- ----------------------------------------------------------------------------
-- usePhotoUpload uploads with `upsert: true` to a deterministic path
-- `{userId}/{itemId}/{slot}.jpg`. Overwriting an existing photo executes a
-- Postgres UPDATE on storage.objects, which requires a storage UPDATE RLS
-- policy. The live `photos` bucket had INSERT/SELECT/DELETE but no UPDATE
-- policy (policies were originally created by hand in the dashboard, so
-- migration 006 never applied), so every re-upload failed with
-- "new row violates row-level security policy".
--
-- This migration records the fix applied directly to prod on 2026-06-18 and
-- makes it reproducible in any fresh environment.
--
-- Idempotent: DROP IF EXISTS + CREATE converges on the correct policy
-- regardless of current live state. Safe to run multiple times.
-- ============================================================================

DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;

CREATE POLICY "Users can update their own photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
