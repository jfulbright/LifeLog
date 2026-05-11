import { baseSchema } from "../../helpers/common.schema";
import { getStatusValues } from "../../helpers/statusLabels";
import { getReflectionFields, getCompanionsField } from "../../helpers/reflection.schema";

const travelFields = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("travel"),
    required: true,
    section: "Main",
    order: 0,
  },
  {
    name: "title",
    label: "Trip Name",
    type: "text",
    required: true,
    placeholder: "e.g. Spring Break in Cancun",
    section: "Main",
    order: 1,
  },

  // ── Where ───────────────────────────────────────────────────────────────────
  {
    name: "country",
    label: "Country",
    type: "select",
    optional: true,
    defaultValue: "US",
    section: "Where",
    order: 10,
  },
  {
    name: "city",
    label: "City",
    type: "city-autocomplete",
    optional: true,
    placeholder: "e.g. Tokyo",
    section: "Where",
    order: 11,
  },
  {
    // Context-aware: US/CA → state dropdown, elsewhere → free text region
    name: "state",
    label: "State / Region",
    type: "state-or-region",
    optional: true,
    section: "Where",
    order: 12,
  },
  // Hidden fields auto-populated by city autocomplete / country picker
  { name: "lat", label: "Lat", type: "text", hidden: true },
  { name: "lng", label: "Lng", type: "text", hidden: true },
  {
    name: "continent",
    label: "Continent",
    type: "text",
    hidden: true,
  },
  {
    name: "tripId",
    label: "Itinerary ID",
    type: "text",
    hidden: true,
  },
  {
    name: "tripName",
    label: "Itinerary Name",
    type: "text",
    hidden: true,
  },

  // ── When ─────────────────────────────────────────────────────────────────────
  ...baseSchema
    .filter((f) => ["startDate", "endDate"].includes(f.name))
    .map((f) => ({
      ...f,
      section: "When",
      order: 20 + (f.name === "endDate" ? 1 : 0),
    })),

  ...getReflectionFields("visited"),

  // ── Planning (wishlist only) ──────────────────────────────────────────────────
  {
    name: "targetMonth",
    label: "Target Month",
    type: "text",
    optional: true,
    placeholder: "e.g. June",
    visibleWhen: { status: "wishlist" },
    section: "Planning",
    order: 35,
  },
  {
    name: "targetYear",
    label: "Target Year",
    type: "number",
    optional: true,
    placeholder: "e.g. 2026",
    inputMode: "numeric",
    visibleWhen: { status: "wishlist" },
    section: "Planning",
    order: 36,
  },
  {
    name: "wishlistReason",
    label: "Why this place?",
    type: "textarea",
    placeholder: "What draws you here?",
    optional: true,
    visibleWhen: { status: "wishlist" },
    section: "Planning",
    order: 37,
    fullWidth: true,
  },
  {
    name: "travelTips",
    label: "Tips for Friends",
    type: "textarea",
    placeholder: "What should friends know before visiting?",
    optional: true,
    visibleWhen: { status: "visited" },
    section: "Planning",
    order: 38,
    fullWidth: true,
  },

  // ── Social (Companions + Visibility + Recommend) ───────────────────────────
  getCompanionsField("visited"),
  {
    name: "visibilityControl",
    type: "visible-to",
    optional: true,
    section: "Social",
    order: 62,
    fullWidth: true,
  },
  {
    name: "recommendation",
    label: "Recommend this place",
    type: "recommend",
    optional: true,
    section: "Social",
    order: 64,
  },

  // ── Details ───────────────────────────────────────────────────────────────────
  ...baseSchema
    .filter((f) => f.name === "tags")
    .map((f) => ({ ...f, section: "Details", order: 50 })),

  ...baseSchema
    .filter((f) => ["createdAt", "section"].includes(f.name))
    .map((f) => ({ ...f, hidden: true })),
];

export default travelFields;
