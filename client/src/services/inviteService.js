/**
 * Invite service -- manages invite creation and lookup.
 */
import { supabase } from "./supabaseClient";

const inviteService = {
  async createInvite({ inviteeEmail, inviteeName, message }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Not authenticated");

    // Find the contact record for this email to count shared entries
    let sharedCount = 0;
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("owner_id", session.user.id)
      .eq("email", inviteeEmail.toLowerCase())
      .single();

    if (contact) {
      const { count } = await supabase
        .from("collaborators")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", session.user.id)
        .eq("collaborator_contact_id", contact.id);
      sharedCount = count || 0;
    }

    const { data, error } = await supabase
      .from("invites")
      .insert({
        inviter_id: session.user.id,
        invitee_email: inviteeEmail.toLowerCase(),
        invitee_name: inviteeName,
        message,
        shared_entry_count: sharedCount,
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
