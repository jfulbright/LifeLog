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

/**
 * The three audience scopes (Strava-style): everyone / custom / private.
 *
 * Persisted explicitly as `visibilityScope` so "Only you, but my collaborators
 * still see it" stays distinguishable from "specific people" — both have no
 * rings and may carry collaborator contacts. Legacy entries without the marker
 * fall back to deriving from the ring selection.
 */
export function getVisibilityScope(formData) {
  if (formData.visibilityScope) return formData.visibilityScope;
  const rings = formData.visibilityRings || [];
  if (isEveryone(rings)) return "everyone";
  if (rings.length === 0 && (formData.visibilityContacts || []).length === 0) return "private";
  return "custom";
}

/**
 * Apply a scope choice. `everyone` selects all rings; `private` clears the
 * passive ring audience but leaves collaborator contacts untouched (collaborate
 * ⟹ visible); `custom` starts from a clean ring slate when coming from everyone
 * so the user picks explicitly, otherwise preserves their current rings.
 */
export function setVisibilityScope(formData, scope) {
  if (scope === "everyone") {
    return { ...formData, visibilityScope: "everyone", visibilityRings: [...RING_LEVELS] };
  }
  if (scope === "private") {
    return { ...formData, visibilityScope: "private", visibilityRings: [] };
  }
  return {
    ...formData,
    visibilityScope: "custom",
    visibilityRings: isEveryone(formData.visibilityRings) ? [] : (formData.visibilityRings || []),
  };
}
