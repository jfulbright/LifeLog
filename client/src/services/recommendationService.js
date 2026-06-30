/**
 * Recommendation service -- manages recommendations between users.
 */
import { supabase } from "./supabaseClient";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

const recommendationService = {
  /**
   * Create recommendations for an entry (to rings and/or individuals).
   * Called when user saves an entry with recommendedToRings or recommendedToContacts.
   */
  async createRecommendations(entryId, category, { toUserIds = [], toRingLevels = [] }) {
    const fromUserId = await getCurrentUserId();
    const rows = [];

    for (const userId of toUserIds) {
      rows.push({
        from_user_id: fromUserId,
        entry_id: entryId,
        entry_category: category,
        to_user_id: userId,
        to_ring_level: null,
      });
    }

    for (const ringLevel of toRingLevels) {
      rows.push({
        from_user_id: fromUserId,
        entry_id: entryId,
        entry_category: category,
        to_user_id: null,
        to_ring_level: ringLevel,
      });
    }

    if (rows.length === 0) return [];

    const { data, error } = await supabase
      .from("recommendations")
      .insert(rows)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Get recommendations directed at the current user.
   */
  async getMyRecommendations(statuses = ["active"]) {
    const userId = await getCurrentUserId();

    // Direct recommendations (to_user_id = me)
    const { data: direct, error: directErr } = await supabase
      .from("recommendations")
      .select("*")
      .eq("to_user_id", userId)
      .in("status", statuses)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (directErr) return [];

    // Ring-based recommendations: find my ring level in each contact relationship.
    // Uses the get_my_ring_recommender_ids() SECURITY DEFINER function (migration 008)
    // because contacts RLS only permits owner_id = auth.uid(), blocking a direct
    // linked_user_id lookup for rows owned by other users.
    const { data: contactsWhoHaveMe } = await supabase.rpc("get_my_ring_recommender_ids");

    let ringRecs = [];
    if (contactsWhoHaveMe?.length) {
      for (const contact of contactsWhoHaveMe) {
        const { data: recs } = await supabase
          .from("recommendations")
          .select("*")
          .eq("from_user_id", contact.recommender_id)
          .eq("to_ring_level", contact.ring_level)
          .in("status", statuses)
          .is("to_user_id", null)
          .is("revoked_at", null);

        if (recs) ringRecs = [...ringRecs, ...recs];
      }
    }

    // Deduplicate by entry_id
    const allRecs = [...(direct || []), ...ringRecs];
    const seen = new Set();
    return allRecs.filter((r) => {
      if (seen.has(r.entry_id)) return false;
      seen.add(r.entry_id);
      return true;
    });
  },

  /**
   * Get the count of active recommendations for badge display.
   */
  async getActiveCount() {
    const recs = await recommendationService.getMyRecommendations();
    return recs.length;
  },

  /**
   * Accept a recommendation (user adds it to their wishlist).
   */
  async acceptRecommendation(recommendationId) {
    const { data, error } = await supabase
      .from("recommendations")
      .update({ status: "accepted" })
      .eq("id", recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Dismiss a recommendation.
   */
  async dismissRecommendation(recommendationId) {
    const { data, error } = await supabase
      .from("recommendations")
      .update({ status: "dismissed" })
      .eq("id", recommendationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get recommendations the current user has sent.
   */
  async getMySentRecommendations() {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .eq("from_user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  },
};

export default recommendationService;
