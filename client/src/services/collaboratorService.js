/**
 * Collaborator service -- manages shared entry collaborations in Supabase.
 */
import { supabase } from "./supabaseClient";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

const collaboratorService = {
  /**
   * Share an entry with specific users (resolved from rings or individual picks).
   */
  async shareEntry(entryId, category, collaboratorUserIds) {
    const ownerId = await getCurrentUserId();

    const rows = collaboratorUserIds.map((userId) => ({
      entry_id: entryId,
      entry_category: category,
      owner_id: ownerId,
      collaborator_user_id: userId,
      status: "pending",
      can_edit: true,
    }));

    const { data, error } = await supabase
      .from("collaborators")
      .upsert(rows, { onConflict: "entry_id,collaborator_user_id", ignoreDuplicates: true })
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Share an entry with contacts by contact_id (works for unlinked contacts).
   * If the contact is already linked, also sets collaborator_user_id.
   * For unlinked contacts, creates a deferred row that resolves on signup.
   */
  async shareEntryWithContacts(entryId, category, contacts) {
    const ownerId = await getCurrentUserId();

    const rows = contacts.map((contact) => ({
      entry_id: entryId,
      entry_category: category,
      owner_id: ownerId,
      collaborator_user_id: contact.linkedUserId || null,
      collaborator_contact_id: contact.id,
      status: "pending",
      can_edit: true,
    }));

    const { data, error } = await supabase
      .from("collaborators")
      .upsert(rows, { ignoreDuplicates: true })
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Remove sharing for specific contacts on an owned entry (un-share).
   * Deletes the collaborator rows by entry + contact id. Owner-only (RLS:
   * "Entry owners can manage collaborators").
   */
  async unshareEntryWithContacts(entryId, contactIds) {
    if (!contactIds?.length) return;
    const { error } = await supabase
      .from("collaborators")
      .delete()
      .eq("entry_id", entryId)
      .in("collaborator_contact_id", contactIds);

    if (error) throw error;
  },

  /**
   * Resolve deferred shares for the current user: links their contacts and
   * back-fills collaborator rows that were created (with a null user id) before
   * they had an account. Self-healing fast-path; safe to call on every login.
   * Visibility does not depend on this — read-time RLS resolves by email too —
   * but calling it keeps the data consistent and snappy.
   */
  async resolveMyCollaborations() {
    const { error } = await supabase.rpc("resolve_my_collaborations");
    if (error) {
      console.error("[collaboratorService] resolveMyCollaborations failed:", error);
    }
  },

  /**
   * Get all collaboration requests directed at the current user.
   * Uses get_my_collaborations() so deferred invites (collaborator_user_id still
   * null, resolved by email) show up in the inbox even before the backfill runs.
   */
  async getIncomingCollaborations() {
    const userId = await getCurrentUserId();

    const { data: mine, error } = await supabase.rpc("get_my_collaborations");
    if (error) throw error;

    const ids = (mine || [])
      .filter((m) => m.owner_id !== userId)
      .map((m) => m.collaborator_id);
    if (ids.length === 0) return [];

    const { data, error: rowsErr } = await supabase
      .from("collaborators")
      .select("*")
      .in("id", ids)
      .order("invited_at", { ascending: false });

    if (rowsErr) throw rowsErr;
    return data || [];
  },

  /**
   * Get pending collaboration count for the current user.
   */
  async getPendingCount() {
    const userId = await getCurrentUserId();

    const { data: mine, error } = await supabase.rpc("get_my_collaborations");
    if (error) return 0;

    return (mine || []).filter(
      (m) => m.owner_id !== userId && m.status === "pending"
    ).length;
  },

  /**
   * Accept a collaboration -- entry now appears in your timeline.
   */
  async acceptCollaboration(collaborationId) {
    const { data, error } = await supabase
      .from("collaborators")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", collaborationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Decline a collaboration.
   */
  async declineCollaboration(collaborationId) {
    const { data, error } = await supabase
      .from("collaborators")
      .update({ status: "declined" })
      .eq("id", collaborationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all collaborator rows for an entry the current user owns (any status).
   * Used to hydrate the share toggle when re-editing an owned item.
   */
  async getCollaboratorsForOwnedEntry(entryId) {
    const { data, error } = await supabase
      .from("collaborators")
      .select("collaborator_contact_id, collaborator_user_id, status")
      .eq("entry_id", entryId);

    if (error) return [];
    return data || [];
  },

  /**
   * Get collaborators for a specific entry (for showing "group album" overlays).
   */
  async getCollaboratorsForEntry(entryId) {
    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("entry_id", entryId)
      .in("status", ["accepted", "pending"]);

    if (error) return [];
    const rows = data || [];

    const ownerId = rows[0]?.owner_id;

    // Resolve names+avatars via the SECURITY DEFINER reveal (B1) so co-collaborators
    // we are NOT connected to still surface their real name+avatar instead of null.
    // Falls back to an empty map (names stay null → "Collaborator") if the function
    // is not yet applied in this environment.
    let profileMap = {};
    const { data: profiles } = await supabase
      .rpc("get_entry_collaborator_profiles", { p_entry_id: entryId });
    (profiles || []).forEach((p) => {
      profileMap[p.user_id] = { id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url };
    });

    const enrichedRows = rows.map((r) => ({
      ...r,
      _profileName: profileMap[r.collaborator_user_id]?.display_name || null,
      _profileAvatarUrl: profileMap[r.collaborator_user_id]?.avatar_url || null,
    }));

    if (ownerId) {
      enrichedRows.unshift({
        id: `owner-${ownerId}`,
        entry_id: entryId,
        owner_id: ownerId,
        collaborator_user_id: ownerId,
        status: "accepted",
        _isOwner: true,
        _profileName: profileMap[ownerId]?.display_name || null,
        _profileAvatarUrl: profileMap[ownerId]?.avatar_url || null,
      });
    }

    return enrichedRows;
  },

  /**
   * Get all entries shared with the current user (accepted).
   * Resolves via get_my_collaborations() so email-linked (deferred) shares are
   * included even if collaborator_user_id was never back-filled.
   */
  async getSharedEntries() {
    const { data: mine, error } = await supabase.rpc("get_my_collaborations");
    if (error) return [];

    const collabs = (mine || []).filter((c) => c.status === "accepted");
    if (!collabs.length) return [];

    // Fetch the actual entries
    const entryIds = collabs.map((c) => c.entry_id);
    const { data: entries, error: entriesError } = await supabase
      .from("items")
      .select("*")
      .in("id", entryIds);

    if (entriesError) return [];

    return (entries || []).map((row) => {
      const collab = collabs.find((c) => c.entry_id === row.id);
      return {
        ...row.data,
        id: row.id,
        _category: row.category,
        _isShared: true,
        _sharedBy: collab?.owner_id,
        _ownerId: collab?.owner_id,
        _sharedAt: collab?.invited_at,
      };
    });
  },
};

export default collaboratorService;
