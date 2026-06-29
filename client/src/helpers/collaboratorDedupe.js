/**
 * Pure helpers for collapsing duplicate collaborator rows (issue #51). Kept out
 * of collaboratorService so they can be unit-tested without the Supabase client.
 */

/** Most-progressed wins when the same person has more than one row. */
export const STATUS_RANK = { accepted: 2, pending: 1, declined: 0 };

/**
 * Collapse duplicate collaborator rows down to one per person. A person can end
 * up with two rows (one keyed by contact, one by linked user) from older shares;
 * we key on contact_id ?? user_id and keep the most-progressed status so the UI
 * never shows the same collaborator twice.
 */
export function dedupeCollaboratorRows(rows) {
  const rank = (s) => STATUS_RANK[s] ?? -1;
  const byPerson = new Map();
  for (const row of rows) {
    const key = row.collaborator_contact_id || row.collaborator_user_id;
    if (!key) continue;
    const existing = byPerson.get(key);
    // The more-progressed row supplies the base fields; the other still
    // contributes any resolved user/contact id and the winning status.
    const base = !existing || rank(row.status) >= rank(existing.status) ? { ...existing, ...row } : existing;
    byPerson.set(key, {
      ...base,
      collaborator_user_id: row.collaborator_user_id || existing?.collaborator_user_id || null,
      collaborator_contact_id: row.collaborator_contact_id || existing?.collaborator_contact_id || null,
      status: rank(row.status) >= rank(existing?.status) ? row.status : existing.status,
    });
  }
  return Array.from(byPerson.values());
}
