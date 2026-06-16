import { RING_LEVELS } from "./ringMeta";

/**
 * Cross-field rules linking "Who can see this" (visibilityRings +
 * visibilityContacts) with the "Share & Collaborate" toggle
 * (shareWithCompanionIds). Kept as pure functions over a formData object so the
 * logic is testable and the components stay thin.
 *
 * Invariant: collaborate ⟹ visible.
 *  - Enabling collaborate for someone adds them to "Who can see this".
 *  - Disabling collaborate leaves them visible (user removes manually).
 *  - Removing someone from "Who can see this" also stops collaborating with them
 *    (you can't collaborate on something they can't see).
 *  - "Who was there" (companions) is independent and never touched here.
 */

const uniq = (arr) => Array.from(new Set(arr));

/** Add a contact to "Who can see this" (idempotent). */
export function addVisibilityContact(formData, contactId) {
  const current = formData.visibilityContacts || [];
  if (current.includes(contactId)) return formData;
  return { ...formData, visibilityContacts: [...current, contactId] };
}

/**
 * Remove a contact from "Who can see this". Also drops any active collaborate
 * share with them — they can't collaborate on an entry they can't see.
 */
export function removeVisibilityContact(formData, contactId) {
  return {
    ...formData,
    visibilityContacts: (formData.visibilityContacts || []).filter((id) => id !== contactId),
    shareWithCompanionIds: (formData.shareWithCompanionIds || []).filter((id) => id !== contactId),
  };
}

/**
 * Apply a new "Share & Collaborate" selection. Newly enabled collaborators are
 * auto-added to "Who can see this"; disabling a collaborator does not remove
 * their visibility (collaborate ⟹ visible, but not the reverse).
 */
export function applyCollaborateChange(formData, nextShareIds) {
  const prevShareIds = formData.shareWithCompanionIds || [];
  const added = nextShareIds.filter((id) => !prevShareIds.includes(id));
  return {
    ...formData,
    shareWithCompanionIds: nextShareIds,
    visibilityContacts: uniq([...(formData.visibilityContacts || []), ...added]),
  };
}

/** True when every ring is selected — i.e. "Everyone" in the user's network. */
export function isEveryone(visibilityRings) {
  const set = new Set(visibilityRings || []);
  return RING_LEVELS.every((level) => set.has(level));
}

/** Toggle the "Everyone" shortcut: select all rings, or clear them all. */
export function toggleEveryone(formData) {
  return {
    ...formData,
    visibilityRings: isEveryone(formData.visibilityRings) ? [] : [...RING_LEVELS],
  };
}
