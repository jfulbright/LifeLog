import { baseSchema } from "helpers/common.schema";
import { locationSchema } from "helpers/location.schema";
import { getStatusValues } from "helpers/statusLabels";
import { getReflectionFields } from "helpers/reflection.schema";

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

  ...locationSchema
    .filter((f) => !["street", "zip"].includes(f.name))
    .map((field, i) => ({
      ...field,
      section: "Location",
      order: 10 + i,
    })),

  ...baseSchema
    .filter((f) => ["startDate", "endDate"].includes(f.name))
    .map((f) => ({
      ...f,
      section: "Dates",
      order: 20 + (f.name === "endDate" ? 1 : 0),
    })),

  ...getReflectionFields("visited"),

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

  ...baseSchema
    .filter((f) => f.name === "tags")
    .map((f) => ({ ...f, section: "Details", order: 40 })),
  {
    name: "photoLink",
    label: "Cover Photo URL",
    type: "url",
    optional: true,
    placeholder: "https://...",
    section: "Details",
    order: 41,
  },

  ...baseSchema
    .filter((f) => ["createdAt", "section"].includes(f.name))
    .map((f) => ({ ...f, hidden: true })),
];

export default travelFields;
