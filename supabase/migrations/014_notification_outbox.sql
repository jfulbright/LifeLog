-- ============================================================================
-- Notification outbox
-- ============================================================================
-- A single durable queue of "something happened that a user may want to hear
-- about." Enqueue triggers (migration 015) write rows here; the immediate
-- Edge Function and the weekly digest both read from here and stamp the row
-- once delivered. This decouples *what happened* from *how/when it's sent*,
-- and is the seam mobile push will reuse later (add a push_sent_at column).
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_outbox (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email     TEXT NOT NULL,
  type                TEXT NOT NULL
    CHECK (type IN ('collab_invite', 'recommendation', 'invite_accepted')),
  source_id           UUID NOT NULL,           -- collaborator / recommendation / invite row id
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  email_sent_at       TIMESTAMPTZ,             -- stamped by the immediate sender
  digest_included_at  TIMESTAMPTZ,             -- stamped by the weekly digest
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: one notification per (recipient, type, source). Ring-based
-- recommendations fan out one source row to many recipients — each recipient
-- still gets exactly one row.
CREATE UNIQUE INDEX IF NOT EXISTS notification_outbox_dedup
  ON notification_outbox (recipient_user_id, type, source_id);

-- Digest scan: undelivered rows per recipient, newest first.
CREATE INDEX IF NOT EXISTS notification_outbox_pending
  ON notification_outbox (recipient_user_id, created_at)
  WHERE email_sent_at IS NULL AND digest_included_at IS NULL;

ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

-- Recipients may read their own notifications (backs a future in-app inbox).
-- Writes happen only via SECURITY DEFINER enqueue functions and the Edge
-- Functions' service-role key, both of which bypass RLS — so no INSERT/UPDATE
-- policy is granted to ordinary users.
CREATE POLICY "Recipients can read own notifications"
  ON notification_outbox FOR SELECT
  USING (recipient_user_id = auth.uid());
