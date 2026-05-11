/**
 * Invite service -- manages invite creation and lookup.
 */
import { supabase } from "./supabaseClient";

const inviteService = {
  async createInvite({ inviteeEmail, inviteeName, message }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Not authenticated");

    // Count shared entries for this contact
    const { count } = await supabase
      .from("collaborators")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", session.user.id)
      .ilike("collaborator_contact_id", inviteeEmail);

    const { data, error } = await supabase
      .from("invites")
      .insert({
        inviter_id: session.user.id,
        invitee_email: inviteeEmail.toLowerCase(),
        invitee_name: inviteeName,
        message,
        shared_entry_count: count || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInviteByToken(token) {
    const { data, error } = await supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .single();

    if (error) return null;
    return data;
  },

  async getMyInvites() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("invites")
      .select("*")
      .eq("inviter_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
  },

  getInviteUrl(token) {
    const baseUrl = process.env.REACT_APP_SITE_URL || window.location.origin;
    return `${baseUrl}/invite/${token}`;
  },
};

export default inviteService;
