-- One-time cleanup: collapse duplicate collaborator rows so a person never
-- appears twice on the same entry (see issue #51).
--
-- The partial unique indexes from migration 007 already prevent two rows with
-- the same (entry_id, collaborator_contact_id) or (entry_id, collaborator_user_id).
-- The duplicate that slips through is *cross-key*: a person shared once by
-- contact id and again by their linked user id ends up with two rows whose keys
-- differ. We treat the contact row as canonical and delete the redundant
-- user-id-only row for the same person on the same entry.
--
-- NOTE: there is no migration runner in this project — apply manually with the
-- Supabase CLI (see CLAUDE.md / memory "migrations-applied-manually").

DELETE FROM collaborators c_user
USING collaborators c_contact, contacts ct
WHERE c_user.collaborator_contact_id IS NULL
  AND c_user.collaborator_user_id IS NOT NULL
  AND c_contact.collaborator_contact_id = ct.id
  AND ct.linked_user_id = c_user.collaborator_user_id
  AND c_contact.entry_id = c_user.entry_id
  AND c_user.id <> c_contact.id;
