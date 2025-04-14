// client/src/helpers/filterUtils.js

import statusLabels from "helpers/statusLabels";

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

/**
 * Returns a display label for the given status + category
 */
export function getStatusLabel(category, status) {
  if (status === "all") return "All";
  return statusLabels[category]?.[status] || status;
}
