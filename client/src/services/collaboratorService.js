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
   * Get all collaboration requests directed at the current user.
   */
  async getIncomingCollaborations() {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("collaborator_user_id", userId)
      .neq("owner_id", userId)
      .order("invited_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get pending collaboration count for the current user.
   */
  async getPendingCount() {
    const userId = await getCurrentUserId();

    const { count, error } = await supabase
      .from("collaborators")
      .select("id", { count: "exact", head: true })
      .eq("collaborator_user_id", userId)
      .neq("owner_id", userId)
      .eq("status", "pending");

    if (error) return 0;
    return count || 0;
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
   * Get collaborators for a specific entry (for showing "group album" overlays).
   */
  async getCollaboratorsForEntry(entryId) {
    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("entry_id", entryId)
      .eq("status", "accepted");

    if (error) return [];
    return data || [];
  },

  /**
   * Get all entries shared with the current user (accepted).
   */
  async getSharedEntries() {
    const userId = await getCurrentUserId();

    const { data: collabs, error } = await supabase
      .from("collaborators")
      .select("entry_id, entry_category, owner_id, status, invited_at")
      .eq("collaborator_user_id", userId)
      .eq("status", "accepted");

    if (error || !collabs?.length) return [];

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
        _category: row.category,
        _sharedBy: collab?.owner_id,
        _sharedAt: collab?.invited_at,
      };
    });
  },
};

export default collaboratorService;
