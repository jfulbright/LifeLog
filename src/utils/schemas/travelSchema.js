import { baseSchema } from "../commonSchema";
import { locationSchema } from "../locationSchema";

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
