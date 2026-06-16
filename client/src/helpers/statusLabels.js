// client/src/helpers/statusLabels.js

const statusLabels = {
  events: {
    attended: "Attended",
    wishlist: "Wishlist",
  },
  cars: {
    owned: "Owned",
    wishlist: "Wishlist",
  },
  homes: {
    owned: "Owned",
    rented: "Rented",
    wishlist: "Wishlist",
  },
  travel: {
    visited: "Visited",
    wishlist: "Wishlist",
  },
  concerts: {
    attended: "Attended",
    wishlist: "Wishlist",
  },
  sports: {
    attended: "Attended",
    wishlist: "Wishlist",
  },
  activities: {
    done: "Accomplished",
    wishlist: "Wishlist",
  },
  cellar: {
    tried: "Enjoyed",
    cellar: "In Cellar",
    wishlist: "Wishlist",
  },
  kids: {
    happened: "Happened",
    upcoming: "Upcoming",
  },
  movies: {
    watched: "Watched",
    watchlist: "Watchlist",
  },
};

export default statusLabels;

/**
 * Helper: Returns value list for dropdowns (e.g. ["visited", "wishlist"])
 */
export const getStatusValues = (category) => {
  return Object.keys(statusLabels[category] || {});
};

/**
 * Helper: Returns display label for a specific status
 */
export const getStatusLabel = (category, status) => {
  if (status === "all") return "All";
  return statusLabels[category]?.[status] || status;
};

/**
 * Helper: Returns the full value→label map for a category
 * (e.g. { done: "Accomplished", wishlist: "Wishlist" }).
 * This is the same map StatusBadge, StatusToggle, and the source filters use,
 * so wiring it into a form's <select> guarantees the dropdown labels match
 * everywhere else.
 */
export const getStatusOptionLabels = (category) => {
  return { ...(statusLabels[category] || {}) };
};

/**
 * Helper: Schema factory for the standard "Status" select field.
 * Pulls both the option values and their display labels from this single
 * source of truth so the dropdown can never drift from the badges/filters.
 * Pass `overrides` to tweak per-schema details (section, order, etc.).
 */
export const getStatusField = (category, overrides = {}) => ({
  name: "status",
  label: "Status",
  type: "select",
  options: getStatusValues(category),
  optionLabels: getStatusOptionLabels(category),
  required: true,
  section: "Main",
  order: 0,
  ...overrides,
});
