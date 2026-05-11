/**
 * Contacts service -- CRUD for the contacts table in Supabase.
 * Replaces localStorage-based contact management from dataService.
 */
import { supabase } from "./supabaseClient";

async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

const contactsService = {
  async getContacts() {
    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("owner_id", userId)
        .order("display_name");

      if (error) throw error;

      // Map DB column names to app field names for compatibility
      return (data || []).map((c) => ({
        id: c.id,
        email: c.email,
        displayName: c.display_name,
        ringLevel: c.ring_level,
        inviteStatus: c.invite_status,
        linkedUserId: c.linked_user_id,
        phone: c.phone,
        createdAt: c.created_at,
      }));
    } catch (err) {
      console.error("[contactsService] getContacts failed:", err);
      return [];
    }
  },

  async addContact(contact) {
    const userId = await getCurrentUserId();
    const emailLower = (contact.email || "").trim().toLowerCase();

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        owner_id: userId,
        email: emailLower,
        display_name: contact.displayName || "",
        ring_level: contact.ringLevel || 3,
        invite_status: "local_only",
        phone: contact.phone || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(`A contact with email "${contact.email}" already exists.`);
      }
      throw error;
    }

    window.dispatchEvent(new Event("data-changed"));
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      ringLevel: data.ring_level,
      inviteStatus: data.invite_status,
      linkedUserId: data.linked_user_id,
      phone: data.phone,
      createdAt: data.created_at,
    };
  },

  async updateContact(id, patch) {
    const dbPatch = {};
    if (patch.displayName !== undefined) dbPatch.display_name = patch.displayName;
    if (patch.ringLevel !== undefined) dbPatch.ring_level = patch.ringLevel;
    if (patch.inviteStatus !== undefined) dbPatch.invite_status = patch.inviteStatus;
    if (patch.linkedUserId !== undefined) dbPatch.linked_user_id = patch.linkedUserId;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone;
    if (patch.email !== undefined) dbPatch.email = patch.email.trim().toLowerCase();

    const { error } = await supabase
      .from("contacts")
      .update(dbPatch)
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        throw new Error(`A contact with that email already exists.`);
      }
      throw error;
    }

    window.dispatchEvent(new Event("data-changed"));
  },

  async deleteContact(id) {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    window.dispatchEvent(new Event("data-changed"));
  },

  /**
   * Resolve ring members to linked user IDs (for sharing).
   * Returns user IDs of contacts in the specified rings who have linked accounts.
   */
  async resolveRingMembers(ringLevels) {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("contacts")
      .select("linked_user_id")
      .eq("owner_id", userId)
      .in("ring_level", ringLevels)
      .not("linked_user_id", "is", null);

    if (error) return [];
    return (data || []).map((c) => c.linked_user_id);
  },

  /**
   * Resolve specific contact IDs to linked user IDs.
   */
  async resolveContactUserIds(contactIds) {
    if (!contactIds?.length) return [];

    const { data, error } = await supabase
      .from("contacts")
      .select("id, linked_user_id")
      .in("id", contactIds)
      .not("linked_user_id", "is", null);

    if (error) return [];
    return (data || []).map((c) => c.linked_user_id);
  },
};

export default contactsService;
