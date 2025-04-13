// client/src/features/homes/homeSchema.js

import { baseSchema } from "helpers/common.schema";
import { locationSchema } from "helpers/location.schema";

const homeSchema = [
  ...baseSchema,
  ...locationSchema,

  {
    name: "type",
    label: "Home Type",
    type: "select",
    options: ["House", "Condo", "Townhouse", "Apartment", "Other"],
  },

  {
    name: "ownership",
    label: "Ownership",
    type: "select",
    options: ["Own", "Rent"],
  },

  // Visible only if ownership is "Rent"
  {
    name: "monthlyRent",
    label: "Monthly Rent",
    type: "number",
    isCurrency: true,
    optional: true,
    visibleWhen: { ownership: "Rent" },
  },

  // Visible only if ownership is "Own"
  {
    name: "purchaseDate",
    label: "Purchase Date",
    type: "date",
    visibleWhen: { ownership: "Own" },
  },
  {
    name: "purchaseAmount",
    label: "Purchase Amount",
    type: "text",
    isCurrency: true,
    visibleWhen: { ownership: "Own" },
  },
  {
    name: "soldDate",
    label: "Sold Date",
    type: "date",
    optional: true,
    visibleWhen: { ownership: "Own" },
  },
  {
    name: "soldAmount",
    label: "Sold Amount",
    type: "number",
    isCurrency: true,
    optional: true,
    visibleWhen: { ownership: "Own" },
  },

  {
    name: "yearsLived",
    label: "Years Lived",
    type: "number",
    optional: true,
  },
  {
    name: "sqft",
    label: "Square Feet",
    type: "number",
    optional: true,
  },
  {
    name: "bedrooms",
    label: "Bedrooms",
    type: "number",
    optional: true,
  },
  {
    name: "bathrooms",
    label: "Bathrooms",
    type: "number",
    optional: true,
  },
];
export default homeSchema;
