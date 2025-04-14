// client/src/features/travel/travelSchema.js

import { baseSchema } from "helpers/common.schema";
import { locationSchema } from "helpers/location.schema";
import { getStatusValues } from "helpers/statusLabels";

// Remove baseSchema's status field and replace it with a scoped one for travel
const travelSchema = [
  // Use status options specific to travel (e.g. "visited", "wishlist")
  // These values and labels are defined in helpers/statusLabels.js

  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("travel"), // ["visited", "wishlist"]
    section: "Main",
    order: 0,
  },

  {
    name: "title",
    label: "Trip Title",
    type: "text",
    optional: true,
    section: "Main",
    order: 0,
  },

  {
    name: "rating",
    label: "Rating (1–10)",
    type: "number",
    optional: true,
    visibleWhen: { status: "visited" },
    section: "Review",
    order: 1,
  },
  {
    name: "targetMonth",
    label: "Target Month",
    type: "text",
    optional: true,
    visibleWhen: { status: "wishlist" },
    section: "Planning",
    order: 2,
  },
  {
    name: "targetYear",
    label: "Target Year",
    type: "number",
    optional: true,
    visibleWhen: { status: "wishlist" },
    section: "Planning",
    order: 3,
  },

  // Add location fields under "Location" section
  ...locationSchema.map((field, i) => ({
    ...field,
    section: "Location",
    order: 10 + i,
  })),

  // Include all shared fields except the default status field
  ...baseSchema.filter((field) => field.name !== "status"),
];

export default travelSchema;
