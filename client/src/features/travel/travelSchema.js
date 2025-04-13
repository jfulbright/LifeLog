import { baseSchema } from "helpers/common.schema";
import { locationSchema } from "helpers/location.schema";

export const travelSchema = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["Visited", "Wishlist"],
  },
  {
    name: "rating",
    label: "Rating (1–10)",
    type: "number",
    optional: true,
    visibleWhen: { status: "Visited" },
  },
  {
    name: "targetMonth",
    label: "Target Month",
    type: "text",
    optional: true,
    visibleWhen: { status: "Wishlist" },
  },
  {
    name: "targetYear",
    label: "Target Year",
    type: "number",
    optional: true,
    visibleWhen: { status: "Wishlist" },
  },
  ...locationSchema,
  ...baseSchema,
];

export default travelSchema;
