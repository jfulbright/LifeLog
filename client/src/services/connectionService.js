/**
 * Connection service -- the user-to-user "Connect" handshake (Epic B / B2).
 *
 * A connection is two reciprocal linked contacts. requestConnection() creates a
 * pending request; accept_connection_request() (SECURITY DEFINER) writes the
 * reciprocal contact rows for both users. Emails stay private until accepted.
 */
import { supabase } from "./supabaseClient";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

const connectionService = {
  /**
   * Send a connection request to another user (e.g. a co-collaborator surfaced
   * by the shared-entry reveal). Idempotent: a duplicate pending request is a
   * no-op.
   */
  async requestConnection(recipientUserId) {
    const me = await getCurrentUserId();
    const { error } = await supabase
      .from("connection_requests")
      .upsert(
        { requester_id: me, recipient_id: recipientUserId, status: "pending" },
        { onConflict: "requester_id,recipient_id", ignoreDuplicates: true }
      );
    if (error && error.code !== "23505") throw error;
    window.dispatchEvent(new Event("data-changed"));
  },

  /** Incoming pending requests, with each requester's name + avatar. */
  async getIncomingRequests() {
    const { data, error } = await supabase.rpc("get_my_connection_requests");
    if (error) return [];
    return data || [];
  },

  /** Count of incoming pending requests (for badges). */
  async getPendingCount() {
    const { data, error } = await supabase.rpc("get_my_connection_requests");
    if (error) return 0;
    return (data || []).length;
  },

  /** Recipient user ids I have an outstanding pending request to (to show "Requested"). */
  async getOutgoingPendingRecipientIds() {
    let me;
    try {
      me = await getCurrentUserId();
    } catch {
      return [];
    }
    const { data, error } = await supabase
      .from("connection_requests")
      .select("recipient_id")
      .eq("requester_id", me)
      .eq("status", "pending");
    if (error) return [];
    return (data || []).map((r) => r.recipient_id);
  },

  /** Accept a request -> writes reciprocal linked contacts for both users. */
  async acceptConnection(requestId) {
    const { error } = await supabase.rpc("accept_connection_request", { p_request_id: requestId });
    if (error) throw error;
    window.dispatchEvent(new Event("data-changed"));
  },

  /** Decline a request. */
  async declineConnection(requestId) {
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "declined", responded_at: new Date().toISOString() })
      .eq("id", requestId);
    if (error) throw error;
    window.dispatchEvent(new Event("data-changed"));
  },
};

export default connectionService;
