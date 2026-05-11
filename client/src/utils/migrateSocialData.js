/**
 * One-time migration: moves contacts, entryTags, and personalOverlays
 * from localStorage to Supabase tables.
 *
 * Call this on app load. It checks if localStorage has data and migrates it.
 * After successful migration, clears the localStorage keys.
 */
import { supabase } from "../services/supabaseClient";

const MIGRATION_FLAG = "social_data_migrated_v1";

export async function migrateSocialDataToSupabase() {
  // Skip if already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const userId = session.user.id;

  try {
    // ── Migrate Contacts ──────────────────────────────────────────────────────
    const contactsRaw = localStorage.getItem("contacts");
    if (contactsRaw) {
      const contacts = JSON.parse(contactsRaw);
      if (contacts.length > 0) {
        const rows = contacts.map((c) => ({
          id: c.id,
          owner_id: userId,
          email: (c.email || "").toLowerCase(),
          display_name: c.displayName || "",
          ring_level: c.ringLevel || 3,
          invite_status: c.inviteStatus || "local_only",
          linked_user_id: c.linkedUserId || null,
          phone: c.phone || null,
          created_at: c.createdAt || new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("contacts")
          .upsert(rows, { onConflict: "owner_id,email", ignoreDuplicates: true });

        if (error) {
          console.error("[migration] contacts failed:", error);
          return; // Don't mark as migrated if it failed
        }
      }
    }

    // ── Migrate Personal Overlays ─────────────────────────────────────────────
    const overlaysRaw = localStorage.getItem("personalOverlays");
    if (overlaysRaw) {
      const overlays = JSON.parse(overlaysRaw);
      if (overlays.length > 0) {
        const rows = overlays.map((o) => ({
          id: o.id,
          entry_id: o.entryId,
          user_id: userId,
          snapshot1: o.snapshot1 || "",
          snapshot2: o.snapshot2 || "",
          snapshot3: o.snapshot3 || "",
          rating: o.rating ? parseInt(o.rating) : null,
          photos: [],
          created_at: o.createdAt || new Date().toISOString(),
          updated_at: o.updatedAt || new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("overlays")
          .upsert(rows, { onConflict: "entry_id,user_id", ignoreDuplicates: true });

        if (error) {
          console.error("[migration] overlays failed:", error);
          return;
        }
      }
    }

    // ── Mark as migrated and clean up localStorage ────────────────────────────
    localStorage.setItem(MIGRATION_FLAG, "true");
    localStorage.removeItem("contacts");
    localStorage.removeItem("entryTags");
    localStorage.removeItem("personalOverlays");

    console.log("[migration] Social data migrated to Supabase successfully.");
    window.dispatchEvent(new Event("data-changed"));
  } catch (err) {
    console.error("[migration] Failed:", err);
  }
}
