/**
 * Profile service -- CRUD for the profiles table in Supabase.
 */
import { supabase } from "./supabaseClient";

const profileService = {
  async getMyProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error && error.code === "PGRST116") {
      // No profile yet -- create one
      const newProfile = {
        id: session.user.id,
        display_name: session.user.user_metadata?.full_name || session.user.email.split("@")[0],
      };
      const { data: created, error: createErr } = await supabase
        .from("profiles")
        .insert(newProfile)
        .select()
        .single();
      if (createErr) throw createErr;
      return created;
    }
    if (error) throw error;
    return data;
  },

  async updateProfile(updates) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getProfileByUserId(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) return null;
    return data;
  },

  async uploadAvatar(file) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Not authenticated");

    const userId = session.user.id;
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Add cache-buster to force refresh
    const urlWithBuster = `${publicUrl}?t=${Date.now()}`;

    await profileService.updateProfile({ avatar_url: urlWithBuster });
    return urlWithBuster;
  },
};

export default profileService;
