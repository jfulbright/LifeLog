/**
 * Centralized category display metadata.
 * Used by ItemCardList, Dashboard, Sidebar, and Timeline to render
 * category-specific icons, colors, and field mappings.
 */
const categoryMeta = {
  concerts: {
    icon: "\u266B",
    color: "var(--color-concerts)",
    primaryField: "artist",
    secondaryFields: ["venue", "city", "state"],
    dateField: "startDate",
  },
  cars: {
    icon: "\uD83D\uDE97",
    color: "var(--color-cars)",
    primaryField: "make",
    secondaryFields: ["year", "model"],
    dateField: "startDate",
  },
  homes: {
    icon: "\uD83C\uDFE0",
    color: "var(--color-homes)",
    primaryField: "type",
    secondaryFields: ["street", "city", "state"],
    dateField: "startDate",
  },
  travel: {
    icon: "\u2708\uFE0F",
    color: "var(--color-travel)",
    primaryField: "title",
    secondaryFields: ["city", "country"],
    dateField: "startDate",
  },
  restaurants: {
    icon: "\uD83C\uDF7D\uFE0F",
    color: "var(--color-restaurants)",
    primaryField: "name",
    secondaryFields: ["city", "state"],
    dateField: "startDate",
  },
  movies: {
    icon: "\uD83C\uDFAC",
    color: "var(--color-movies)",
    primaryField: "title",
    secondaryFields: ["year"],
    dateField: "startDate",
  },
};

export default categoryMeta;

export function getCategoryMeta(category) {
  return categoryMeta[category] || {
    icon: "\uD83D\uDCCB",
    color: "var(--color-primary)",
    primaryField: "title",
    secondaryFields: [],
    dateField: "startDate",
  };
}
