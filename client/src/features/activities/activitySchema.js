import { baseSchema } from "../../helpers/common.schema";
import { getStatusValues } from "../../helpers/statusLabels";
import { getReflectionFields } from "../../helpers/reflection.schema";

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
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("activities"),
    required: true,
    section: "Main",
    order: 0,
  },
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
    section: "Location",
    order: 10,
  },
  {
    name: "city",
    label: "City",
    type: "city-autocomplete",
    optional: true,
    placeholder: "e.g. Whistler",
    section: "Location",
    order: 11,
  },
  {
    name: "country",
    label: "Country",
    type: "select",
    optional: true,
    defaultValue: "US",
    section: "Location",
    order: 12,
  },
  { name: "lat", label: "Lat", type: "text", hidden: true },
  { name: "lng", label: "Lng", type: "text", hidden: true },
  { name: "continent", label: "Continent", type: "text", hidden: true },
  {
    name: "difficulty",
    label: "Difficulty",
    type: "select",
    options: ["Easy", "Moderate", "Hard", "Expert"],
    optional: true,
    section: "Details",
    order: 13,
  },
  {
    name: "linkedTripId",
    label: "Linked Trip ID",
    type: "text",
    optional: true,
    hidden: true,
  },
  {
    name: "linkedTripTitle",
    label: "Linked Trip",
    type: "text",
    optional: true,
    placeholder: "e.g. Japan 2026",
    section: "Details",
    order: 14,
  },

  // Dates
  ...baseSchema
    .filter((f) => ["startDate", "endDate"].includes(f.name))
    .map((f) => ({
      ...f,
      label: f.name === "startDate" ? "Date" : "End Date",
      section: "Dates",
      order: 20 + (f.name === "endDate" ? 1 : 0),
    })),

  // Reflection fields (visible when status = "done")
  ...getReflectionFields("done"),

  // Planning (wishlist only)
  {
    name: "wishlistReason",
    label: "Why this activity?",
    type: "textarea",
    placeholder: "What draws you to this?",
    optional: true,
    visibleWhen: { status: "wishlist" },
    section: "Planning",
    order: 37,
    fullWidth: true,
  },

  // Social
  {
    name: "visibilityControl",
    type: "visible-to",
    optional: true,
    section: "Social",
    order: 43,
    fullWidth: true,
  },
  {
    name: "recommendation",
    label: "Recommend this activity",
    type: "recommend",
    optional: true,
    visibleWhen: { status: ["done", "wishlist"] },
    section: "Social",
    order: 45,
  },

  // Details
  ...baseSchema
    .filter((f) => f.name === "tags")
    .map((f) => ({ ...f, section: "Details", order: 50 })),
  {
    name: "photoLink",
    label: "Cover Photo URL",
    type: "url",
    optional: true,
    placeholder: "https://...",
    section: "Details",
    order: 51,
  },

  ...baseSchema
    .filter((f) => ["createdAt", "section"].includes(f.name))
    .map((f) => ({ ...f, hidden: true })),
];

export default activityFields;
