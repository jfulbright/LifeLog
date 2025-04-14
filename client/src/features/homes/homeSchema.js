// client/src/features/homes/homeSchema.js

import { baseSchema } from "helpers/common.schema";
import { locationSchema } from "helpers/location.schema";
import { getStatusValues } from "helpers/statusLabels";

const homeSchema = [
  // Use status options specific to homes (e.g. "owned", "rented", "wishlist")
  // These values and labels are defined in helpers/statusLabels.js
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("homes"),
    section: "Main",
    order: 0,
  },

  {
    name: "type",
    label: "Home Type",
    type: "select",
    options: ["House", "Condo", "Townhouse", "Apartment", "Other"],
    section: "Main",
    order: 1,
  },

  // RENTERS
  {
    name: "monthlyRent",
    label: "Monthly Rent",
    type: "number",
    isCurrency: true,
    optional: true,
    visibleWhen: { status: "rented" },
    section: "Rent Info",
    order: 2,
  },

  // OWNERS
  {
    name: "purchaseDate",
    label: "Purchase Date",
    type: "date",
    visibleWhen: { status: "owned" },
    section: "Ownership Info",
    order: 3,
  },
  {
    name: "purchasePrice",
    label: "Purchase Price",
    type: "number",
    isCurrency: true,
    visibleWhen: { status: "owned" },
    section: "Ownership Info",
    order: 4,
  },
  {
    name: "soldDate",
    label: "Sold Date",
    type: "date",
    optional: true,
    visibleWhen: { status: "owned" },
    section: "Ownership Info",
    order: 5,
  },
  {
    name: "soldPrice",
    label: "Sold Price",
    type: "number",
    isCurrency: true,
    optional: true,
    visibleWhen: { status: "owned" },
    section: "Ownership Info",
    order: 6,
  },

  {
    name: "yearsLived",
    label: "Years Lived",
    type: "number",
    optional: true,
    section: "Details",
    order: 7,
  },
  {
    name: "sqft",
    label: "Square Feet",
    type: "number",
    optional: true,
    section: "Details",
    order: 8,
  },
  {
    name: "bedrooms",
    label: "Bedrooms",
    type: "number",
    optional: true,
    section: "Details",
    order: 9,
  },
  {
    name: "bathrooms",
    label: "Bathrooms",
    type: "number",
    optional: true,
    section: "Details",
    order: 10,
  },

  // Location fields (grouped under Location section)
  ...locationSchema.map((field, i) => ({
    ...field,
    section: "Location",
    order: 20 + i,
  })),

  // Shared fields (e.g., notes, tags, createdDate), minus base status
  ...baseSchema.filter((field) => field.name !== "status"),
];

export default homeSchema;
