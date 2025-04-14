// src/features/cars/carSchema.js

import { baseSchema } from "helpers/common.schema";
import { getStatusValues } from "helpers/statusLabels";

const carSchema = [
  // Use status options specific to cars (e.g. "owned", "wishlist")
  // These values and labels are defined in helpers/statusLabels.js
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("cars"),
    section: "Main",
    order: 0,
  },

  {
    name: "vin",
    label: "VIN",
    type: "text",
    section: "Main",
    order: 1,
  },
  {
    name: "make",
    label: "Make",
    type: "text",
    section: "Main",
    order: 2,
  },
  {
    name: "model",
    label: "Model",
    type: "text",
    section: "Main",
    order: 3,
  },
  {
    name: "year",
    label: "Year",
    type: "text",
    section: "Main",
    order: 4,
  },
  {
    name: "trim",
    label: "Trim",
    type: "text",
    optional: true,
    section: "Details",
    order: 5,
  },
  {
    name: "bodyClass",
    label: "Body Class",
    type: "text",
    optional: true,
    section: "Details",
    order: 6,
  },
  {
    name: "fuelType",
    label: "Fuel Type",
    type: "text",
    optional: true,
    section: "Details",
    order: 7,
  },
  {
    name: "engineModel",
    label: "Engine Model",
    type: "text",
    optional: true,
    section: "Details",
    order: 8,
  },
  {
    name: "engineCylinders",
    label: "Engine Cylinders",
    type: "number",
    optional: true,
    section: "Details",
    order: 9,
  },
  {
    name: "displacement",
    label: "Displacement (L)",
    type: "text",
    optional: true,
    section: "Details",
    order: 10,
  },
  {
    name: "driveType",
    label: "Drive Type",
    type: "text",
    optional: true,
    section: "Details",
    order: 11,
  },
  {
    name: "transmission",
    label: "Transmission",
    type: "text",
    optional: true,
    section: "Details",
    order: 12,
  },
  {
    name: "doors",
    label: "Doors",
    type: "number",
    optional: true,
    section: "Details",
    order: 13,
  },
  {
    name: "builtIn",
    label: "Built In (Country)",
    type: "text",
    optional: true,
    section: "Details",
    order: 14,
  },
  {
    name: "startDate",
    label: "Purchase Date",
    type: "date",
    section: "Ownership",
    order: 15,
  },
  {
    name: "endDate",
    label: "Sold Date",
    type: "date",
    optional: true,
    section: "Ownership",
    order: 16,
  },
  {
    name: "purchasePrice",
    label: "Purchase Price",
    type: "number",
    isCurrency: true,
    section: "Ownership",
    order: 17,
  },
  {
    name: "soldPrice",
    label: "Sold Price",
    type: "number",
    isCurrency: true,
    optional: true,
    section: "Ownership",
    order: 18,
  },

  // Add shared fields (e.g. tags, notes, photoLink), excluding the default status
  ...baseSchema.filter((field) => field.name !== "status"),
];

export default carSchema;
