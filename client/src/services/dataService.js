/**
 * Data service abstraction layer.
 * Phase 6: Supabase implementation — all category items read/write to PostgreSQL.
 *          Contacts, entryTags, and personalOverlays remain in localStorage
 *          until Phase 7 adds multi-user social features.
 * Phase 7: swap contacts/entryTags/personalOverlays internals — no consumer changes needed.
 */

import { supabase } from "../services/supabaseClient";

// ── localStorage keys (contacts + Phase 7 social data) ────────────────────────

export const STORAGE_KEYS = {
  events: "events",
  concerts: "concerts",
  travel: "travels",
  cars: "cars",
  homes: "homes",
  contacts: "contacts",
  entryTags: "entryTags",
  personalOverlays: "personalOverlays",
};

// Category keys that are stored in Supabase (not localStorage)
const SUPABASE_CATEGORIES = new Set(["events", "concerts", "travel", "cars", "homes", "activities", "cellar", "kids", "movies"]);

// ── Auth helper ────────────────────────────────────────────────────────────────

async function getCurrentUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");
  return session.user.id;
}

// ── Item shape helpers ─────────────────────────────────────────────────────────

/**
 * Map a full app item object to a Supabase row.
 * Common searchable/filterable fields are promoted to columns;
 * all other fields live in the `data` JSONB column.
 */
function itemToRow(item, category, userId) {
  // Strip transient UI-only form fields that must not be persisted to Supabase
  // eslint-disable-next-line no-unused-vars
  const { shareWithCompanionIds, visibilityControl, _taggedCompanions, _recommendedCompanions, ...cleanItem } = item;
  return {
    id: cleanItem.id,
    user_id: userId,
    category,
    status: cleanItem.status || null,
    start_date: cleanItem.startDate || null,
    updated_at: new Date().toISOString(),
    data: cleanItem,
  };
}

/** Map a Supabase row back to the app item shape (data column contains everything). */
function rowToItem(row) {
  return row.data;
}

// ── Category Items (Supabase) ──────────────────────────────────────────────────

const dataService = {
  async getItems(category) {
    if (!SUPABASE_CATEGORIES.has(category)) {
      // Fall back to localStorage for non-category data
      try {
        const raw = localStorage.getItem(STORAGE_KEYS[category] || category);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    }

    try {
      const userId = await getCurrentUserId();
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId)
        .eq("category", category)
        .order("start_date", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return (data || []).map(rowToItem);
    } catch (err) {
      console.error(`[dataService] getItems(${category}) failed:`, err);
      return [];
    }
  },

  /**
   * Sync the full items array for a category.
   * - Upserts all items in the provided array (handles create + update)
   * - Deletes any DB rows for this category that are no longer in the array
   *
   * Called by useCategory's save effect after every mutation.
   */
  async saveItems(category, items) {
    if (!SUPABASE_CATEGORIES.has(category)) {
      try {
        localStorage.setItem(
          STORAGE_KEYS[category] || category,
          JSON.stringify(items)
        );
        return;
      } catch (err) {
        console.error(`[dataService] saveItems(${category}) failed:`, err);
        throw err;
      }
    }

    try {
      const userId = await getCurrentUserId();

      if (items.length === 0) {
        // Delete all rows for this category
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("user_id", userId)
          .eq("category", category);
        if (error) throw error;
        return;
      }

      // Upsert all current items
      const rows = items.map((item) => itemToRow(item, category, userId));
      const { error: upsertError } = await supabase
        .from("items")
        .upsert(rows, { onConflict: "id" });
      if (upsertError) throw upsertError;

      // Delete orphaned rows (items removed from the local array)
      const currentIds = items.map((i) => i.id);
      const { error: deleteError } = await supabase
        .from("items")
        .delete()
        .eq("user_id", userId)
        .eq("category", category)
        .not("id", "in", `(${currentIds.join(",")})`);
      if (deleteError) throw deleteError;
    } catch (err) {
      console.error(`[dataService] saveItems(${category}) failed:`, err);
      throw err;
    }
  },

  async addItem(category, item) {
    const items = await dataService.getItems(category);
    items.push(item);
    await dataService.saveItems(category, items);
    return items;
  },

  async updateItem(category, id, item) {
    const items = await dataService.getItems(category);
    const updated = items.map((i) => (i.id === id ? { ...item, id } : i));
    await dataService.saveItems(category, updated);
    return updated;
  },

  async deleteItem(category, id) {
    // Best-effort photo cleanup before removing the DB row.
    // Only runs for Supabase-backed categories (not localStorage ones).
    if (SUPABASE_CATEGORIES.has(category)) {
      try {
        const userId = await getCurrentUserId();
        await dataService.deleteItemPhotos(userId, id);
      } catch (err) {
        console.warn("[dataService] photo cleanup skipped:", err);
      }
    }
    const items = await dataService.getItems(category);
    const filtered = items.filter((i) => i.id !== id);
    await dataService.saveItems(category, filtered);
    return filtered;
  },

  /**
   * Removes all photo files for an item from Supabase Storage.
   * Uses list() so it catches any extension or slot variation — future-proof
   * and cleans up any pre-existing mixed-extension orphans.
   * Non-throwing: logs failures but never blocks the caller.
   */
  async deleteItemPhotos(userId, itemId) {
    try {
      const { data: files, error } = await supabase.storage
        .from("photos")
        .list(`${userId}/${itemId}`);
      if (error || !files || files.length === 0) return;
      const paths = files.map((f) => `${userId}/${itemId}/${f.name}`);
      const { error: removeError } = await supabase.storage
        .from("photos")
        .remove(paths);
      if (removeError) {
        console.warn("[dataService] deleteItemPhotos remove failed:", removeError);
      }
    } catch (err) {
      console.warn("[dataService] deleteItemPhotos failed:", err);
    }
  },

  async getAllItems() {
    const categoryKeys = ["events", "concerts", "travel", "cars", "homes", "activities", "cellar", "kids", "movies"];
    const groups = await Promise.all(
      categoryKeys.map(async (category) => {
        const items = await dataService.getItems(category);
        return items.map((item) => ({ ...item, _category: category }));
      })
    );
    return groups.flat();
  },

  async getCount(category) {
    if (!SUPABASE_CATEGORIES.has(category)) {
      const items = await dataService.getItems(category);
      return items.length;
    }

    try {
      const userId = await getCurrentUserId();
      const { count, error } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("category", category);
      if (error) throw error;
      return count ?? 0;
    } catch (err) {
      console.error(`[dataService] getCount(${category}) failed:`, err);
      return 0;
    }
  },

  async getCounts() {
    const categoryKeys = ["events", "concerts", "travel", "cars", "homes", "activities", "cellar", "kids", "movies"];
    const entries = await Promise.all(
      categoryKeys.map(async (category) => [
        category,
        await dataService.getCount(category),
      ])
    );
    return Object.fromEntries(entries);
  },

  // ── Contacts (localStorage — Phase 7 will move to Supabase) ────────────────

  async getContacts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.contacts);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("[dataService] getContacts failed:", err);
      return [];
    }
  },

  async addContact(contact) {
    const contacts = await dataService.getContacts();
    const emailLower = (contact.email || "").trim().toLowerCase();
    const duplicate = contacts.find(
      (c) => (c.email || "").toLowerCase() === emailLower
    );
    if (duplicate) {
      throw new Error(`A contact with email "${contact.email}" already exists.`);
    }
    const newContact = {
      id: crypto.randomUUID(),
      email: emailLower,
      displayName: contact.displayName || "",
      ringLevel: contact.ringLevel || 3,
      inviteStatus: "local_only",
      linkedUserId: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [...contacts, newContact];
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(updated));
    window.dispatchEvent(new Event("data-changed"));
    return newContact;
  },

  async updateContact(id, patch) {
    const contacts = await dataService.getContacts();
    if (patch.email) {
      const emailLower = patch.email.trim().toLowerCase();
      const duplicate = contacts.find(
        (c) => c.id !== id && (c.email || "").toLowerCase() === emailLower
      );
      if (duplicate) {
        throw new Error(`A contact with email "${patch.email}" already exists.`);
      }
      patch = { ...patch, email: emailLower };
    }
    const updated = contacts.map((c) => (c.id === id ? { ...c, ...patch } : c));
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(updated));
    window.dispatchEvent(new Event("data-changed"));
    return updated;
  },

  async deleteContact(id) {
    const contacts = await dataService.getContacts();
    const updated = contacts.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(updated));
    window.dispatchEvent(new Event("data-changed"));
    return updated;
  },

  // ── Entry Tags (localStorage — Phase 7) ────────────────────────────────────

  async getEntryTags() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.entryTags);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("[dataService] getEntryTags failed:", err);
      return [];
    }
  },

  async getTagsForEntry(entryId) {
    const tags = await dataService.getEntryTags();
    return tags.filter((t) => t.entryId === entryId);
  },

  async addEntryTag(tag) {
    const tags = await dataService.getEntryTags();
    const newTag = {
      id: crypto.randomUUID(),
      entryId: tag.entryId,
      contactId: tag.contactId,
      taggedAt: new Date().toISOString(),
      status: "pending",
    };
    const updated = [...tags, newTag];
    localStorage.setItem(STORAGE_KEYS.entryTags, JSON.stringify(updated));
    return newTag;
  },

  async updateEntryTag(id, patch) {
    const tags = await dataService.getEntryTags();
    const updated = tags.map((t) => (t.id === id ? { ...t, ...patch } : t));
    localStorage.setItem(STORAGE_KEYS.entryTags, JSON.stringify(updated));
    return updated;
  },

  async deleteEntryTagsForEntry(entryId) {
    const tags = await dataService.getEntryTags();
    const updated = tags.filter((t) => t.entryId !== entryId);
    localStorage.setItem(STORAGE_KEYS.entryTags, JSON.stringify(updated));
    return updated;
  },

  // ── Personal Overlays (localStorage — Phase 7) ─────────────────────────────

  async getPersonalOverlays() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.personalOverlays);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("[dataService] getPersonalOverlays failed:", err);
      return [];
    }
  },

  async getOverlaysForEntry(entryId) {
    const overlays = await dataService.getPersonalOverlays();
    return overlays.filter((o) => o.entryId === entryId);
  },

  async savePersonalOverlay(overlay) {
    const overlays = await dataService.getPersonalOverlays();
    const existing = overlays.find(
      (o) => o.entryId === overlay.entryId && o.contactId === overlay.contactId
    );
    let updated;
    if (existing) {
      updated = overlays.map((o) =>
        o.id === existing.id
          ? {
              ...o,
              snapshot1: overlay.snapshot1 ?? o.snapshot1,
              snapshot2: overlay.snapshot2 ?? o.snapshot2,
              snapshot3: overlay.snapshot3 ?? o.snapshot3,
              rating: overlay.rating ?? o.rating,
              photo1: overlay.photo1 ?? o.photo1,
              photo2: overlay.photo2 ?? o.photo2,
              photo3: overlay.photo3 ?? o.photo3,
              updatedAt: new Date().toISOString(),
            }
          : o
      );
    } else {
      const newOverlay = {
        id: crypto.randomUUID(),
        entryId: overlay.entryId,
        contactId: overlay.contactId,
        snapshot1: overlay.snapshot1 || "",
        snapshot2: overlay.snapshot2 || "",
        snapshot3: overlay.snapshot3 || "",
        rating: overlay.rating || "",
        photo1: overlay.photo1 || "",
        photo2: overlay.photo2 || "",
        photo3: overlay.photo3 || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [...overlays, newOverlay];
    }
    localStorage.setItem(
      STORAGE_KEYS.personalOverlays,
      JSON.stringify(updated)
    );
    return updated;
  },

  async deleteOverlaysForEntry(entryId) {
    const overlays = await dataService.getPersonalOverlays();
    const updated = overlays.filter((o) => o.entryId !== entryId);
    localStorage.setItem(
      STORAGE_KEYS.personalOverlays,
      JSON.stringify(updated)
    );
    return updated;
  },
};

export default dataService;
