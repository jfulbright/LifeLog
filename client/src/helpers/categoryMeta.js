import { getCountryName } from "../data/countries";

/**
 * Centralized category display metadata.
 * Used by ItemCardList, Dashboard, Sidebar, and Timeline to render
 * category-specific icons, colors, and field mappings.
 */
const categoryMeta = {
  events: {
    icon: "\uD83C\uDFAB",
    color: "var(--color-events)",
    primaryField: "artist",
    secondaryFields: ["venue", "city", "state"],
    dateField: "startDate",
    getPrimaryDisplay: (item) => {
      switch (item.eventType) {
        case "concert": return item.artist || "";
        case "sports": return item.teams || "";
        case "broadway": return item.showName || "";
        case "comedy": return item.comedian || "";
        case "festival": return item.festivalName || "";
        case "other": return item.eventName || "";
        default: return item.artist || item.teams || item.showName || "";
      }
    },
  },
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
    getSecondaryDisplay: (item) => {
      const city = item.city || "";
      const country = getCountryName(item.country) || item.country || "";
      return [city, country].filter(Boolean).join(", ");
    },
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
  activities: {
    icon: "\uD83C\uDFD4\uFE0F",
    color: "var(--color-activities, #2EB67D)",
    primaryField: "activityType",
    secondaryFields: ["locationName", "city"],
    dateField: "startDate",
  },
  wines: {
    icon: "🍷",
    color: "var(--color-wines, #8B3A8F)",
    primaryField: "wineName",
    secondaryFields: ["winery", "vintage", "region"],
    dateField: "startDate",
    getSecondaryDisplay: (item) => {
      const parts = [item.winery, item.vintage, item.region].filter(Boolean);
      return parts.join(" · ");
    },
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
