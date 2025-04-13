// carSchema.js
import { baseSchema } from "helpers/common.schema";

const carSchema = [
  {
    name: "vin",
    label: "VIN",
    type: "text",
  },
  {
    name: "make",
    label: "Make",
    type: "text",
  },
  {
    name: "model",
    label: "Model",
    type: "text",
  },
  {
    name: "year",
    label: "Year",
    type: "text",
  },
  {
    name: "trim",
    label: "Trim",
    type: "text",
    optional: true,
  },
  {
    name: "bodyClass",
    label: "Body Class",
    type: "text",
    optional: true,
  },
  {
    name: "fuelType",
    label: "Fuel Type",
    type: "text",
    optional: true,
  },
  {
    name: "engineModel",
    label: "Engine Model",
    type: "text",
    optional: true,
  },
  {
    name: "engineCylinders",
    label: "Engine Cylinders",
    type: "number",
    optional: true,
  },
  {
    name: "displacement",
    label: "Displacement (L)",
    type: "text",
    optional: true,
  },
  {
    name: "driveType",
    label: "Drive Type",
    type: "text",
    optional: true,
  },
  {
    name: "transmission",
    label: "Transmission",
    type: "text",
    optional: true,
  },
  {
    name: "doors",
    label: "Doors",
    type: "number",
    optional: true,
  },
  {
    name: "builtIn",
    label: "Built In (Country)",
    type: "text",
    optional: true,
  },
  {
    name: "startDate",
    label: "Purchase Date",
    type: "date",
  },
  {
    name: "endDate",
    label: "Sold Date",
    type: "date",
    optional: true,
  },
  {
    name: "purchasePrice",
    label: "Purchase Price",
    type: "number",
    isCurrency: true,
  },
  {
    name: "soldPrice",
    label: "Sold Price",
    type: "number",
    isCurrency: true,
    optional: true,
  },
  ...baseSchema,
];

export default carSchema;
