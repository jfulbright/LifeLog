/**
 * Merge "Who was there?" (companions) with the entry's collaborators into a
 * single, deduped people list for display (issue #53).
 *
 * Each person appears exactly once. A companion who is also a collaborator is
 * annotated with their collaboration status (pending/accepted) so the UI can
 * mark them with a 🤝. Collaborators who weren't tagged as companions are still
 * included. The owner row is excluded — the owner is surfaced via Shared Memories.
 *
 * @returns {{ key, displayName, ringLevel, isCollaborator, status }[]}
 */
import { STATUS_RANK } from "./collaboratorDedupe";

function normalizeCompanion(entry) {
  if (typeof entry === "string") return { type: "freetext", name: entry };
  return entry;
}

export function getPeopleWithCollabStatus(companions, collaborators, contacts) {
  const byKey = new Map();
  const contactList = contacts || [];

  // 1) Seed from companions (the canonical "who was there" list).
  (companions || []).forEach((raw) => {
    const entry = normalizeCompanion(raw);
    if (entry.type === "contact") {
      const contact = contactList.find((c) => c.id === entry.contactId);
      byKey.set(entry.contactId, {
        key: entry.contactId,
        displayName: contact?.displayName || entry.displayName || "?",
        ringLevel: contact?.ringLevel ?? null,
        isCollaborator: false,
        status: null,
      });
    } else if (entry.name) {
      const key = `name:${entry.name.toLowerCase()}`;
      if (!byKey.has(key)) {
        byKey.set(key, { key, displayName: entry.name, ringLevel: null, isCollaborator: false, status: null });
      }
    }
  });

  // 2) Fold in collaborators, matching them to an existing person when possible.
  (collaborators || []).forEach((collab) => {
    if (collab._isOwner) return;
    const contact = contactList.find(
      (c) => c.id === collab.collaborator_contact_id || c.linkedUserId === collab.collaborator_user_id
    );
    const key = contact?.id
      || (collab.collaborator_contact_id && `contact:${collab.collaborator_contact_id}`)
      || (collab.collaborator_user_id && `user:${collab.collaborator_user_id}`);
    if (!key) return;

    const existing = byKey.get(key);
    const status = bestStatus(existing?.status, collab.status);
    byKey.set(key, {
      key,
      displayName: existing?.displayName || contact?.displayName || collab._profileName || "Collaborator",
      ringLevel: existing?.ringLevel ?? contact?.ringLevel ?? null,
      isCollaborator: true,
      status,
    });
  });

  return Array.from(byKey.values());
}

function bestStatus(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return (STATUS_RANK[b] ?? -1) > (STATUS_RANK[a] ?? -1) ? b : a;
}
