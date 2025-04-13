// client/src/helpers/location.schema.js

export const locationSchema = [
  { name: "street", label: "Street Address", type: "text", optional: true },
  { name: "city", label: "City", type: "text", optional: true },
  { name: "state", label: "State", type: "text", optional: true },
  { name: "zip", label: "ZIP Code", type: "text", optional: true },
  { name: "country", label: "Country", type: "text", optional: true },
  { name: "lat", label: "Lat", type: "text", hidden: true },
  { name: "lng", label: "Lng", type: "text", hidden: true },
];
