/**
 * Data service abstraction layer.
 * Phase 3: localStorage implementation.
 * Phase 4: swap internals with API calls — no consumer changes needed.
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
  getItems(category) {
    try {
      const raw = localStorage.getItem(getStorageKey(category));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveItems(category, items) {
    localStorage.setItem(getStorageKey(category), JSON.stringify(items));
  },

  addItem(category, item) {
    const items = dataService.getItems(category);
    items.push(item);
    dataService.saveItems(category, items);
    return items;
  },

  updateItem(category, id, item) {
    const items = dataService.getItems(category);
    const updated = items.map((i) => (i.id === id ? { ...item, id } : i));
    dataService.saveItems(category, updated);
    return updated;
  },

  deleteItem(category, id) {
    const items = dataService.getItems(category);
    const filtered = items.filter((i) => i.id !== id);
    dataService.saveItems(category, filtered);
    return filtered;
  },

  getAllItems() {
    return Object.keys(STORAGE_KEYS).flatMap((category) =>
      dataService.getItems(category).map((item) => ({ ...item, _category: category }))
    );
  },

  getCount(category) {
    return dataService.getItems(category).length;
  },

  getCounts() {
    const counts = {};
    for (const category of Object.keys(STORAGE_KEYS)) {
      counts[category] = dataService.getCount(category);
    }
    return counts;
  },
};

export default dataService;
export { STORAGE_KEYS };
