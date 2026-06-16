import { baseSchema } from "../../helpers/common.schema";
import { getStatusField } from "../../helpers/statusLabels";
import { getReflectionFields, getCompanionsField } from "../../helpers/reflection.schema";
import { getLocationFields } from "../../helpers/location.schema";

export const ACTIVITY_TYPES = {
  snow: {
    label: "❄️ Snow",
    options: ["Skiing", "Snowboarding", "Heli-skiing", "Cross-Country Skiing", "Snowshoeing"],
  },
  bike: {
    label: "🚴 Bike",
    options: ["Mountain Biking", "Road Cycling", "Gravel Riding"],
  },
  water: {
    label: "🌊 Water",
    options: ["Surfing", "Kayaking", "Scuba Diving", "Paddleboarding", "Whitewater Rafting"],
  },
  land: {
    label: "🏔️ Land",
    options: ["Hiking", "Rock Climbing", "Trail Running", "Golf", "Bungee Jumping"],
  },
  air: {
    label: "🪂 Air",
    options: ["Skydiving", "Paragliding", "Hot Air Balloon"],
  },
};

/** Flat list of all activity type options for the select dropdown. */
export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_TYPES).flatMap(
  ([, group]) => group.options
);

const activityFields = [
  getStatusField("activities"),
  {
    name: "activityType",
    label: "Activity",
    type: "select",
    options: ACTIVITY_TYPE_OPTIONS,
    required: true,
    placeholder: "e.g. Snowboarding",
    section: "Main",
    order: 1,
  },
  {
    name: "locationName",
    label: "Location / Venue",
    type: "text",
    optional: true,
    placeholder: "e.g. Whistler Blackcomb",
    section: "Where",
    order: 10,
  },
  ...getLocationFields({ section: "Where", startOrder: 11 }),
  {
    name: "difficulty",
    label: "Difficulty",
    type: "select",
    options: ["Easy", "Moderate", "Hard", "Expert"],
    optional: true,
    section: "Details",
    order: 20,
  },
  {
    name: "linkedTripId",
    label: "Linked Trip ID",
    type: "text",
    optional: true,
    hidden: true,
  },
  {
    name: "linkedTrip",
    label: "Part of a Trip",
    type: "linked-trip",
    optional: true,
    helperText: "Link this to a trip in your Travel log",
    section: "Trip",
    order: 22,
    visibleWhen: { status: "done" },
  },

  // Dates → When
  ...baseSchema
    .filter((f) => ["startDate", "endDate"].includes(f.name))
    .map((f) => ({
      ...f,
      label: f.name === "startDate" ? "Date" : "End Date",
      section: "When",
      order: 25 + (f.name === "endDate" ? 1 : 0),
    })),

  // Reflection fields (visible when status = "done")
  ...getReflectionFields("done"),

  // Planning (wishlist only) -- appears early so target timeframe is prominent
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
    label: "Why this activity?",
    type: "textarea",
    placeholder: "What draws you to this?",
    optional: true,
    visibleWhen: { status: "wishlist" },
    section: "Details",
    order: 21,
    fullWidth: true,
  },

  // Social (Companions + Visibility + Recommend)
  getCompanionsField("done"),
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

  // Details
  ...baseSchema
    .filter((f) => f.name === "tags")
    .map((f) => ({ ...f, section: "Details", order: 50 })),

  ...baseSchema
    .filter((f) => ["createdAt", "section"].includes(f.name))
    .map((f) => ({ ...f, hidden: true })),
];

export default activityFields;
