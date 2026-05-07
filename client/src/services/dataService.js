/**
 * Data service abstraction layer.
 * Phase 3: localStorage implementation — all methods return Promises.
 * Phase 6: swap internals with real API calls — no consumer changes needed.
 */

const STORAGE_KEYS = {
  concerts: "concerts",
  travel: "travels",
  cars: "cars",
  homes: "homes",
};

function getStorageKey(category) {
  return STORAGE_KEYS[category] || category;
}

const dataService = {
  async getItems(category) {
    try {
      const raw = localStorage.getItem(getStorageKey(category));
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error(`[dataService] getItems(${category}) failed:`, err);
      return [];
    }
  },

  async saveItems(category, items) {
    try {
      localStorage.setItem(getStorageKey(category), JSON.stringify(items));
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
    const items = await dataService.getItems(category);
    const filtered = items.filter((i) => i.id !== id);
    await dataService.saveItems(category, filtered);
    return filtered;
  },

  async getAllItems() {
    const groups = await Promise.all(
      Object.keys(STORAGE_KEYS).map(async (category) => {
        const items = await dataService.getItems(category);
        return items.map((item) => ({ ...item, _category: category }));
      })
    );
    return groups.flat();
  },

  async getCount(category) {
    const items = await dataService.getItems(category);
    return items.length;
  },

  async getCounts() {
    const entries = await Promise.all(
      Object.keys(STORAGE_KEYS).map(async (category) => [
        category,
        await dataService.getCount(category),
      ])
    );
    return Object.fromEntries(entries);
  },
};

export default dataService;
export { STORAGE_KEYS };
