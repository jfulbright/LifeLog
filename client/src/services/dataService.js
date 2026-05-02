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

  updateItem(category, index, item) {
    const items = dataService.getItems(category);
    items[index] = item;
    dataService.saveItems(category, items);
    return items;
  },

  deleteItem(category, index) {
    const items = dataService.getItems(category);
    items.splice(index, 1);
    dataService.saveItems(category, items);
    return items;
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
