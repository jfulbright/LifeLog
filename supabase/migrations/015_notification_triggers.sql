-- ============================================================================
-- Notification enqueue triggers
-- ============================================================================
-- AFTER INSERT/UPDATE triggers that translate social events into
-- notification_outbox rows. All are SECURITY DEFINER so they can read
-- auth.users / profiles and write the outbox regardless of the acting user's
-- RLS context. Every insert is ON CONFLICT DO NOTHING for idempotency.
--
-- Best-effort entry title: the primary field is `data->>'title'`; travel uses
-- `tripName`, a few categories use `name`; otherwise fall back to the category.
-- ============================================================================

-- ── 1. Collaboration invite → notify the invited collaborator ────────────────
CREATE OR REPLACE FUNCTION enqueue_collab_invite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email  TEXT;
  v_actor  TEXT;
  v_title  TEXT;
BEGIN
  -- Only freshly-pending invites to a real platform user (deferred/unlinked
  -- contacts get a separate invite email and have no user_id yet).
  IF NEW.status <> 'pending' OR NEW.collaborator_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = NEW.collaborator_user_id;
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_actor FROM profiles WHERE id = NEW.owner_id;

  SELECT COALESCE(
           NULLIF(data->>'title', ''),
           NULLIF(data->>'tripName', ''),
           NULLIF(data->>'name', ''),
           initcap(replace(NEW.entry_category, '_', ' '))
         )
    INTO v_title
    FROM items WHERE id = NEW.entry_id;

  INSERT INTO notification_outbox (recipient_user_id, recipient_email, type, source_id, payload)
  VALUES (
    NEW.collaborator_user_id,
    v_email,
    'collab_invite',
    NEW.id,
    jsonb_build_object(
      'actor_name',     COALESCE(NULLIF(v_actor, ''), 'Someone'),
      'entry_title',    COALESCE(v_title, 'an entry'),
      'entry_category', NEW.entry_category,
      'link_path',      '/shared'
    )
  )
  ON CONFLICT (recipient_user_id, type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_collaborator_invite_notify ON collaborators;
CREATE TRIGGER on_collaborator_invite_notify
  AFTER INSERT ON collaborators
  FOR EACH ROW EXECUTE FUNCTION enqueue_collab_invite_notification();


-- ── 2. Recommendation → notify recipient(s) (direct or ring fan-out) ──────────
CREATE OR REPLACE FUNCTION enqueue_recommendation_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor TEXT;
  v_title TEXT;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT display_name INTO v_actor FROM profiles WHERE id = NEW.from_user_id;
  SELECT COALESCE(
           NULLIF(data->>'title', ''),
           NULLIF(data->>'tripName', ''),
           NULLIF(data->>'name', ''),
           initcap(replace(NEW.entry_category, '_', ' '))
         )
    INTO v_title
    FROM items WHERE id = NEW.entry_id;

  -- One INSERT..SELECT covers both shapes:
  --   • direct rec  → exactly the named user (to_user_id)
  --   • ring rec    → every linked contact the sender placed in that ring
  -- (inverse of get_my_ring_recommender_ids from migration 008).
  INSERT INTO notification_outbox (recipient_user_id, recipient_email, type, source_id, payload)
  SELECT
    r.recipient_id,
    u.email,
    'recommendation',
    NEW.id,
    jsonb_build_object(
      'actor_name',     COALESCE(NULLIF(v_actor, ''), 'Someone'),
      'entry_title',    COALESCE(v_title, 'something'),
      'entry_category', NEW.entry_category,
      'link_path',      '/recommendations'
    )
  FROM (
    SELECT NEW.to_user_id AS recipient_id
    WHERE NEW.to_user_id IS NOT NULL
    UNION
    SELECT c.linked_user_id AS recipient_id
    FROM contacts c
    WHERE NEW.to_user_id IS NULL
      AND NEW.to_ring_level IS NOT NULL
      AND c.owner_id = NEW.from_user_id
      AND c.ring_level = NEW.to_ring_level
      AND c.linked_user_id IS NOT NULL
  ) r
  JOIN auth.users u ON u.id = r.recipient_id
  WHERE r.recipient_id <> NEW.from_user_id   -- never notify yourself
  ON CONFLICT (recipient_user_id, type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_recommendation_notify ON recommendations;
CREATE TRIGGER on_recommendation_notify
  AFTER INSERT ON recommendations
  FOR EACH ROW EXECUTE FUNCTION enqueue_recommendation_notifications();


-- ── 3. Invite accepted → notify the original inviter ─────────────────────────
CREATE OR REPLACE FUNCTION enqueue_invite_accepted_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF OLD.status = 'accepted' OR NEW.status <> 'accepted' THEN
    RETURN NEW;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = NEW.inviter_id;
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO notification_outbox (recipient_user_id, recipient_email, type, source_id, payload)
  VALUES (
    NEW.inviter_id,
    v_email,
    'invite_accepted',
    NEW.id,
    jsonb_build_object(
      'actor_name', COALESCE(NULLIF(NEW.invitee_name, ''), NEW.invitee_email, 'Someone you invited'),
      'link_path',  '/settings'
    )
  )
  ON CONFLICT (recipient_user_id, type, source_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invite_accepted_notify ON invites;
CREATE TRIGGER on_invite_accepted_notify
  AFTER UPDATE OF status ON invites
  FOR EACH ROW EXECUTE FUNCTION enqueue_invite_accepted_notification();
