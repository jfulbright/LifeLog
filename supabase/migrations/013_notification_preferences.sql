-- ============================================================================
-- Notification preferences — formalize the column
-- ============================================================================
-- `profiles.notification_preferences` has been written ad hoc by the client
-- (Settings → NotificationsTab) without ever being declared. This guarantees
-- the column exists with a non-null default so the email Edge Functions can
-- rely on reading it for every user (new and backfilled).
--
-- Preference shape (all keys optional; Edge Functions treat missing as default):
--   {
--     "collab_snaps_inapp":     true,            -- existing in-app toggle
--     "invite_accepted_inapp":  true,            -- existing in-app toggle
--     "email_enabled":          true,            -- master email switch
--     "email_delivery":         "weekly_digest", -- "immediate" | "weekly_digest" | "off"
--     "email_collab_invite":    true,            -- someone shares/invites me
--     "email_recommendation":   true,            -- someone recommends to me
--     "email_invite_accepted":  false            -- someone I invited joins
--   }
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill any rows that predate the default.
UPDATE profiles
  SET notification_preferences = '{}'::jsonb
  WHERE notification_preferences IS NULL;
