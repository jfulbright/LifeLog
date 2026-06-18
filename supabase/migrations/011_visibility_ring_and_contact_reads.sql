-- 011_visibility_ring_and_contact_reads.sql
--
-- Enforces the "Who can see this" control at the RLS layer for the VIEWER role
-- (someone browsing another user's profile), covering BOTH dimensions the form
-- already writes:
--   * data.visibilityRings    -> int[] of ring levels the owner shared with
--   * data.visibilityContacts -> array of the OWNER's contact ids (individuals)
--
-- ROOT CAUSE this fixes (USER_STORIES.md F-008):
--   The items table had NO ring-/contact-visibility SELECT policy. Cross-user
--   reads were granted only through an accepted `collaborators` row or a
--   `recommendations` recipient row. So a pure "viewer" — placed in a ring, or
--   named individually in "Who can see this" — got ZERO rows back, regardless of
--   visibilityRings/visibilityContacts. ContactProfile.js compounded this by
--   over-fetching and filtering client-side against the WRONG ring (the ring the
--   *viewer* assigned the *owner*, not the ring the owner assigned the viewer).
--
-- MODEL (mirrors migration 010's self-healing collaborator resolution):
--   visibilityContacts holds the OWNER's contact ids, not the viewer's user id.
--   We resolve "which of an owner's contacts is ME" the same way 010 resolves
--   collaborators: by contacts.linked_user_id = auth.uid() OR by normalized email
--   (contacts.email == my auth email). This means a not-yet-linked contact (NULL
--   linked_user_id) grants visibility the moment the invitee's email exists —
--   no signup trigger or backfill required.

-- ── 1. Source of truth: which contacts (across all owners) resolve to ME ───────
-- SECURITY DEFINER so it can read contacts + auth.users across owners without
-- tripping their RLS. Returns only rows that name the CALLER, so it leaks nothing
-- about other people. Resolution mirrors get_my_collaborations() from 010.
CREATE OR REPLACE FUNCTION get_my_viewer_contacts()
RETURNS TABLE(owner_id uuid, contact_id uuid, ring_level int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.owner_id, c.id, c.ring_level
  FROM contacts c
  WHERE c.linked_user_id = auth.uid()
     OR normalize_email(c.email) = (
          SELECT normalize_email(u.email) FROM auth.users u WHERE u.id = auth.uid()
        );
$$;

-- ── 2. Ring- OR contact-based read policy on items ─────────────────────────────
-- Permissive policy: OR-combined with the existing owner / collaborator /
-- recommendation SELECT policies. A viewer can read an entry when the owner
-- either (a) shared it with a ring the owner placed the viewer in, OR
-- (b) named the viewer's contact id in visibilityContacts.
--
-- jsonb operators:
--   (data -> 'visibilityRings') @> to_jsonb(ring_level)  -> array contains my ring
--   (data -> 'visibilityContacts') ? contact_id::text    -> array contains my id
-- A missing key yields NULL (treated as no-match), so "Only Me" entries (empty
-- arrays) stay private.
DROP POLICY IF EXISTS "Viewers can read ring or contact visible entries" ON items;
CREATE POLICY "Viewers can read ring or contact visible entries" ON items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM get_my_viewer_contacts() v
    WHERE v.owner_id = items.user_id
      AND (
        (items.data -> 'visibilityRings') @> to_jsonb(v.ring_level)
        OR (items.data -> 'visibilityContacts') ? (v.contact_id::text)
      )
  )
);

-- ── 3. Grants (RLS evaluates these as the querying role) ───────────────────────
GRANT EXECUTE ON FUNCTION get_my_viewer_contacts() TO authenticated, anon;
