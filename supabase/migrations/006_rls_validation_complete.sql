-- ============================================================================
-- RLS Validation + Photo Storage Security
-- Run this in Supabase Dashboard > SQL Editor
-- Ensures all social sharing policies are correct and complete.
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS patterns).
-- ============================================================================

-- ── 1. Items table: ensure collaborators can SELECT shared entries ────────────
-- (May already exist from earlier fix -- safe to recreate)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Collaborators can read shared entries'
  ) THEN
    EXECUTE 'CREATE POLICY "Collaborators can read shared entries" ON items FOR SELECT USING (
      id IN (
        SELECT entry_id FROM collaborators
        WHERE collaborator_user_id = auth.uid()
          AND status IN (''pending'', ''accepted'')
      )
    )';
  END IF;
END $$;

-- ── 2. Items table: ensure collaborators can UPDATE shared entries ────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Collaborators can edit shared entries'
  ) THEN
    EXECUTE 'CREATE POLICY "Collaborators can edit shared entries" ON items FOR UPDATE USING (
      id IN (
        SELECT entry_id FROM collaborators
        WHERE collaborator_user_id = auth.uid()
          AND can_edit = true
          AND status = ''accepted''
      )
    )';
  END IF;
END $$;

-- ── 3. Items table: ensure recommended entries are readable ───────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Recipients can read recommended entries'
  ) THEN
    EXECUTE 'CREATE POLICY "Recipients can read recommended entries" ON items FOR SELECT USING (
      id IN (
        SELECT entry_id FROM recommendations
        WHERE to_user_id = auth.uid() AND status = ''active''
      )
    )';
  END IF;
END $$;

-- ── 4. Collaborators: ensure SELECT + UPDATE for recipients ──────────────────

DROP POLICY IF EXISTS "Collaborators can read and update their own rows" ON collaborators;
CREATE POLICY "Collaborators can read their rows"
  ON collaborators FOR SELECT USING (collaborator_user_id = auth.uid());

DROP POLICY IF EXISTS "Collaborators can update status" ON collaborators;
CREATE POLICY "Collaborators can update status"
  ON collaborators FOR UPDATE
  USING (collaborator_user_id = auth.uid())
  WITH CHECK (collaborator_user_id = auth.uid());

-- ── 5. Overlays: full access for own + read for collaborators ────────────────

DROP POLICY IF EXISTS "Users can manage own overlays" ON overlays;
CREATE POLICY "Users can manage own overlays"
  ON overlays FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure collaborators can view overlays on entries they collaborate on
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'overlays' AND policyname = 'Collaborators can view overlays on shared entries'
  ) THEN
    EXECUTE 'CREATE POLICY "Collaborators can view overlays on shared entries" ON overlays FOR SELECT USING (
      entry_id IN (
        SELECT entry_id FROM collaborators
        WHERE collaborator_user_id = auth.uid() AND status = ''accepted''
      )
      OR
      entry_id IN (
        SELECT id FROM items WHERE user_id = auth.uid()
      )
    )';
  END IF;
END $$;

-- ── 6. Recommendations: broader read for ring-based recommendations ──────────

DROP POLICY IF EXISTS "Users can read recommendations directed to them" ON recommendations;
CREATE POLICY "Users can read recommendations directed to them"
  ON recommendations FOR SELECT USING (
    to_user_id = auth.uid()
    OR (
      to_user_id IS NULL
      AND to_ring_level IS NOT NULL
      AND from_user_id IN (
        SELECT owner_id FROM contacts
        WHERE linked_user_id = auth.uid()
      )
    )
  );

-- ── 7. Photos storage: ensure collaborator uploads go to their own path ──────
-- Storage policies (avatars bucket already set up)
-- Photos bucket: users upload under their own userId folder

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'photos') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
  END IF;
END $$;

-- Allow users to upload photos under their own user ID path
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload photos to own folder'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can upload photos to own folder"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = ''photos'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can update own photos'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own photos"
      ON storage.objects FOR UPDATE
      USING (bucket_id = ''photos'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own photos'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own photos"
      ON storage.objects FOR DELETE
      USING (bucket_id = ''photos'' AND auth.uid()::text = (storage.foldername(name))[1])';
  END IF;
END $$;

-- Photos are publicly readable (for display in shared entries)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Photos are publicly readable'
  ) THEN
    EXECUTE 'CREATE POLICY "Photos are publicly readable"
      ON storage.objects FOR SELECT
      USING (bucket_id = ''photos'')';
  END IF;
END $$;
