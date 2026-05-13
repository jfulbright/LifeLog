/**
 * Data service abstraction layer.
 * Supabase implementation -- all active category and social data read/write to PostgreSQL.
 * localStorage is retained only as a read-only migration source for legacy data.
 */

import { supabase } from "../services/supabaseClient";

// ── Legacy localStorage keys used only by migration/import paths ──────────────

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
function stripTransientFields(item) {
  return Object.fromEntries(
    Object.entries(item || {}).filter(([key]) => !key.startsWith("_"))
  );
}

function itemToRow(item, category, userId) {
  // Strip transient UI-only form fields that must not be persisted to Supabase
  // eslint-disable-next-line no-unused-vars
  const { shareWithCompanionIds, visibilityControl, ...rawItem } = item;
  const cleanItem = stripTransientFields(rawItem);
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
function rowToItem(row, currentUserId) {
  return {
    ...row.data,
    id: row.id,
    _category: row.category,
    _ownerId: row.user_id,
    _currentUserId: currentUserId,
  };
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
      return (data || []).map((row) => rowToItem(row, userId));
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
      console.warn(`[dataService] saveItems(${category}) skipped: localStorage writes are disabled.`);
      return;
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

  // ── Legacy Contacts (read-only migration fallback) ─────────────────────────

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
    throw new Error("localStorage contact writes are disabled. Use contactsService instead.");
  },

  async updateContact(id, patch) {
    throw new Error("localStorage contact writes are disabled. Use contactsService instead.");
  },

  async deleteContact(id) {
    throw new Error("localStorage contact writes are disabled. Use contactsService instead.");
  },

  // ── Legacy Entry Tags (read-only migration fallback) ───────────────────────

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
    throw new Error("localStorage entry tag writes are disabled. Use collaboratorService instead.");
  },

  async updateEntryTag(id, patch) {
    throw new Error("localStorage entry tag writes are disabled. Use collaboratorService instead.");
  },

  async deleteEntryTagsForEntry(entryId) {
    throw new Error("localStorage entry tag writes are disabled. Use collaboratorService instead.");
  },

  // ── Legacy Personal Overlays (read-only migration fallback) ────────────────

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
    throw new Error("localStorage overlay writes are disabled. Use overlayService instead.");
  },

  async deleteOverlaysForEntry(entryId) {
    throw new Error("localStorage overlay writes are disabled. Use overlayService instead.");
  },

  /**
   * Get items for a category merged with accepted shared entries from collaborators.
   * Shared entries get _isShared=true and _sharedBy set to the owner's user ID.
   */
  async getItemsWithShared(category) {
    const ownItems = await dataService.getItems(category);

    try {
      const userId = await getCurrentUserId();
      const { data: collabs } = await supabase
        .from("collaborators")
        .select("entry_id, owner_id")
        .eq("collaborator_user_id", userId)
        .neq("owner_id", userId)
        .eq("status", "accepted")
        .eq("entry_category", category);

      if (!collabs?.length) return ownItems;

      const entryIds = collabs.map((c) => c.entry_id);
      const { data: rows } = await supabase
        .from("items")
        .select("*")
        .in("id", entryIds);

      const sharedItems = (rows || []).map((row) => {
        const collab = collabs.find((c) => c.entry_id === row.id);
        return {
          ...row.data,
          id: row.id,
          _isShared: true,
          _sharedBy: collab?.owner_id,
          _ownerId: collab?.owner_id || row.user_id,
          _category: row.category,
          _currentUserId: userId,
        };
      });

      return [...ownItems, ...sharedItems];
    } catch {
      return ownItems;
    }
  },
};

export default dataService;
