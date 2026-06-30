-- 015_connection_requests.sql
--
-- Epic B / B2 — Connect handshake.
--
-- When you see a co-collaborator you are not connected to (B1 reveal), "Connect"
-- creates a pending mutual request. On accept, BOTH sides get a linked contact —
-- so each can now see the other's full profile and co-attended entries.
--
-- Emails stay private until accepted: the reveal exposes only name+avatar, and the
-- reciprocal contact rows are written by a SECURITY DEFINER function that reads
-- auth.users server-side. New contacts default to the Acquaintances ring (5) —
-- requires migration 013.

CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT no_self_connect CHECK (requester_id <> recipient_id),
  UNIQUE (requester_id, recipient_id)
);

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Both parties can read their own requests.
DROP POLICY IF EXISTS "view own connection requests" ON connection_requests;
CREATE POLICY "view own connection requests" ON connection_requests FOR SELECT
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- The requester creates the request.
DROP POLICY IF EXISTS "create connection request" ON connection_requests;
CREATE POLICY "create connection request" ON connection_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Recipient responds (accept/decline); requester may cancel. The accept side
-- effects (reciprocal contacts) run through accept_connection_request().
DROP POLICY IF EXISTS "respond to connection request" ON connection_requests;
CREATE POLICY "respond to connection request" ON connection_requests FOR UPDATE
  USING (recipient_id = auth.uid() OR requester_id = auth.uid())
  WITH CHECK (true);

-- ── Incoming pending requests, with the requester's name+avatar ────────────────
CREATE OR REPLACE FUNCTION get_my_connection_requests()
RETURNS TABLE(
  id uuid,
  requester_id uuid,
  display_name text,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cr.id, cr.requester_id, p.display_name, p.avatar_url, cr.created_at
  FROM connection_requests cr
  JOIN profiles p ON p.id = cr.requester_id
  WHERE cr.recipient_id = auth.uid() AND cr.status = 'pending'
  ORDER BY cr.created_at DESC;
$$;

-- ── Accept: mark accepted + write reciprocal linked contacts for both users ────
CREATE OR REPLACE FUNCTION accept_connection_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r connection_requests%ROWTYPE;
  req_email text;
  rec_email text;
  req_name text;
  rec_name text;
BEGIN
  SELECT * INTO r FROM connection_requests WHERE id = p_request_id;
  IF r.id IS NULL THEN
    RAISE EXCEPTION 'connection request not found';
  END IF;
  IF r.recipient_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized to accept this request';
  END IF;
  IF r.status <> 'pending' THEN
    RETURN; -- idempotent
  END IF;

  SELECT email INTO req_email FROM auth.users WHERE id = r.requester_id;
  SELECT email INTO rec_email FROM auth.users WHERE id = r.recipient_id;
  SELECT display_name INTO req_name FROM profiles WHERE id = r.requester_id;
  SELECT display_name INTO rec_name FROM profiles WHERE id = r.recipient_id;

  UPDATE connection_requests
  SET status = 'accepted', responded_at = now()
  WHERE id = p_request_id;

  -- Recipient (me) gets a contact for the requester.
  INSERT INTO contacts (owner_id, email, display_name, ring_level, invite_status, linked_user_id)
  VALUES (
    r.recipient_id, lower(req_email),
    coalesce(nullif(req_name, ''), split_part(req_email, '@', 1)),
    5, 'accepted', r.requester_id
  )
  ON CONFLICT (owner_id, email) DO UPDATE
    SET linked_user_id = EXCLUDED.linked_user_id, invite_status = 'accepted';

  -- Requester gets a contact for the recipient.
  INSERT INTO contacts (owner_id, email, display_name, ring_level, invite_status, linked_user_id)
  VALUES (
    r.requester_id, lower(rec_email),
    coalesce(nullif(rec_name, ''), split_part(rec_email, '@', 1)),
    5, 'accepted', r.recipient_id
  )
  ON CONFLICT (owner_id, email) DO UPDATE
    SET linked_user_id = EXCLUDED.linked_user_id, invite_status = 'accepted';
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_connection_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION accept_connection_request(uuid) TO authenticated;
