// client/src/helpers/filterUtils.js

import statusLabels, { getStatusLabel } from "../helpers/statusLabels";

/**
 * Returns a list of available status filters for a category
 * e.g., ['all', 'owned', 'wishlist'] for cars
 */
export function getStatusFilterOptions(category) {
  const categoryLabels = statusLabels[category] || {};
  return ["all", ...Object.keys(categoryLabels)];
}

/**
 * Filters items based on selected status
 */
export function filterByStatus(items, selectedStatus) {
  if (selectedStatus === "all") return items;
  return items.filter((item) => item.status === selectedStatus);
}

export { getStatusLabel };

/**
 * Reads the desired source filter ("mine" | "shared" | "recommended") from the
 * URL query string (?source=...) so deep links from the Shared Experiences and
 * Recommendations pages land on the matching source tab. Defaults to "all".
 * Used as the initial value for each category list's sourceFilter state.
 */
export function getInitialSourceFilter() {
  if (typeof window === "undefined") return "all";
  const source = new URLSearchParams(window.location.search).get("source");
  return ["mine", "shared", "recommended"].includes(source) ? source : "all";
}
