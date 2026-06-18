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

const DEFAULT_DATE_FIELDS = ["startDate", "createdAt"];

/**
 * Resolves a date string from an item given a dateField spec, which may be a
 * function, a single field name, or an ordered list of fallback field names.
 */
function getItemDateValue(item, dateField = DEFAULT_DATE_FIELDS) {
  if (typeof dateField === "function") return dateField(item);
  const fields = Array.isArray(dateField) ? dateField : [dateField];
  for (const f of fields) {
    if (item[f]) return item[f];
  }
  return "";
}

/** Extracts a 4-digit year from a date string (date-only or full ISO timestamp). */
function yearOf(value) {
  if (!value) return NaN;
  const s = String(value);
  const dt = s.length <= 10 ? new Date(s + "T00:00:00") : new Date(s);
  return dt.getFullYear();
}

/**
 * Returns the distinct years present across items (newest first) for the Year
 * filter pills. Shared so every page derives its year list identically.
 */
export function getYearOptions(items, dateField = DEFAULT_DATE_FIELDS) {
  const years = new Set();
  (items || []).forEach((item) => {
    const y = yearOf(getItemDateValue(item, dateField));
    if (!isNaN(y)) years.add(y);
  });
  return [...years].sort((a, b) => b - a);
}

/** Filters items to a single year ("all" passes everything through). */
export function filterByYear(items, year, dateField = DEFAULT_DATE_FIELDS) {
  if (!year || year === "all") return items;
  return items.filter(
    (item) => String(yearOf(getItemDateValue(item, dateField))) === String(year)
  );
}
