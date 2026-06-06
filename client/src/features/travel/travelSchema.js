import { baseSchema } from "../../helpers/common.schema";
import { getStatusValues } from "../../helpers/statusLabels";
import { getReflectionFields, getCompanionsField } from "../../helpers/reflection.schema";
import { getLocationFields } from "../../helpers/location.schema";

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
  ...getLocationFields({ section: "Where", startOrder: 10 }),
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
    type: "select",
    options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    optional: true,
    visibleWhen: { status: "wishlist" },
    section: "Planning",
    order: 14,
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
    order: 15,
  },
  {
    name: "wishlistReason",
    label: "Why this place?",
    type: "textarea",
    placeholder: "What draws you here?",
    optional: true,
    visibleWhen: { status: "wishlist" },
    section: "Details",
    order: 51,
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
    label: "🔒 Who can see this",
    type: "visible-to",
    optional: true,
    section: "Social",
    order: 65,
    fullWidth: true,
  },
  {
    name: "recommendation",
    label: "⭐ Recommend to",
    type: "recommend",
    optional: true,
    section: "Social",
    order: 61,
    fullWidth: true,
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
