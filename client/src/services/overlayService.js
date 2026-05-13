/**
 * Overlay service -- manages personal Snapshots/photos per user per entry.
 */
import { supabase } from "./supabaseClient";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

const overlayService = {
  /**
   * Get the current user's overlay for an entry.
   */
  async getMyOverlay(entryId) {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("overlays")
      .select("*")
      .eq("entry_id", entryId)
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") return null;
    if (error) throw error;
    return data;
  },

  /**
   * Save or update the current user's overlay on an entry.
   */
  async saveOverlay(entryId, overlayData) {
    const userId = await getCurrentUserId();

    const payload = {
      entry_id: entryId,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (overlayData.snapshot1 !== undefined) payload.snapshot1 = overlayData.snapshot1 || "";
    if (overlayData.snapshot2 !== undefined) payload.snapshot2 = overlayData.snapshot2 || "";
    if (overlayData.snapshot3 !== undefined) payload.snapshot3 = overlayData.snapshot3 || "";
    if (overlayData.rating !== undefined) payload.rating = overlayData.rating || null;
    if (overlayData.photos !== undefined) payload.photos = overlayData.photos || [];
    if (overlayData.why_notes !== undefined) {
      payload.why_notes = overlayData.why_notes || "";
    }

    const { data, error } = await supabase
      .from("overlays")
      .upsert(payload, { onConflict: "entry_id,user_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get ALL overlays for an entry (for the "group album" view).
   */
  async getOverlaysForEntry(entryId) {
    const { data, error } = await supabase
      .from("overlays")
      .select("*")
      .eq("entry_id", entryId);

    if (error) return [];
    return data || [];
  },

  /**
   * Bulk-load overlays for multiple entries.
   */
  async getOverlaysForEntries(entryIds) {
    const ids = [...new Set((entryIds || []).filter(Boolean))];
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from("overlays")
      .select("*")
      .in("entry_id", ids);

    if (error) return [];
    return data || [];
  },

  /**
   * Delete the current user's overlay on an entry.
   */
  async deleteOverlay(entryId) {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from("overlays")
      .delete()
      .eq("entry_id", entryId)
      .eq("user_id", userId);

    if (error) throw error;
  },
};

export default overlayService;
