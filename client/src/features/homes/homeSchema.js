import { baseSchema } from "helpers/common.schema";
import { locationSchema } from "helpers/location.schema";
import { getStatusValues } from "helpers/statusLabels";
import { getReflectionFields } from "helpers/reflection.schema";

const homeSchema = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("homes"),
    required: true,
    section: "Main",
    order: 0,
  },

  {
    name: "type",
    label: "Home Type",
    type: "select",
    options: ["House", "Condo", "Townhouse", "Apartment", "Other"],
    required: true,
    section: "Main",
    order: 1,
  },

  {
    name: "monthlyRent",
    label: "Monthly Rent",
    type: "number",
    isCurrency: true,
    optional: true,
    placeholder: "$1,500",
    inputMode: "numeric",
    visibleWhen: { status: "rented" },
    section: "Rent Info",
    order: 2,
  },

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
    placeholder: "$250,000",
    inputMode: "numeric",
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
    placeholder: "$275,000",
    inputMode: "numeric",
    visibleWhen: { status: "owned" },
    section: "Ownership Info",
    order: 6,
  },

  {
    name: "yearsLived",
    label: "Years Lived",
    type: "number",
    optional: true,
    placeholder: "e.g. 5",
    inputMode: "numeric",
    section: "Details",
    order: 7,
  },
  {
    name: "sqft",
    label: "Square Feet",
    type: "number",
    optional: true,
    placeholder: "e.g. 2400",
    inputMode: "numeric",
    section: "Details",
    order: 8,
  },
  {
    name: "bedrooms",
    label: "Bedrooms",
    type: "number",
    optional: true,
    placeholder: "e.g. 3",
    inputMode: "numeric",
    section: "Details",
    order: 9,
  },
  {
    name: "bathrooms",
    label: "Bathrooms",
    type: "number",
    optional: true,
    placeholder: "e.g. 2",
    inputMode: "numeric",
    section: "Details",
    order: 10,
  },

  ...locationSchema.map((field, i) => ({
    ...field,
    section: "Location",
    order: 20 + i,
  })),

  ...getReflectionFields(["owned", "rented"]),

  ...baseSchema.filter((field) => !["status", "notes"].includes(field.name)),
];

export default homeSchema;
