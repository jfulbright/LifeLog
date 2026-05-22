const CITY_STATES = ["SG", "MC", "VA", "GI", "HK", "MO"];

export function getLocationFields({ section = "Where", startOrder = 25 } = {}) {
  return [
    {
      name: "city",
      label: "City",
      type: "city-autocomplete",
      optional: true,
      placeholder: "e.g. Austin",
      section,
      order: startOrder,
    },
    {
      name: "state",
      label: "State / Region",
      type: "state-or-region",
      optional: true,
      section,
      order: startOrder + 1,
      visibleWhen: { country: (val) => !CITY_STATES.includes(val) },
    },
    {
      name: "country",
      label: "Country",
      type: "select",
      optional: true,
      defaultValue: "US",
      section,
      order: startOrder + 2,
    },
    { name: "lat", label: "Lat", type: "text", hidden: true },
    { name: "lng", label: "Lng", type: "text", hidden: true },
    { name: "continent", label: "Continent", type: "text", hidden: true },
  ];
}

export const locationSchema = [
  {
    name: "street",
    label: "Street Address",
    type: "text",
    optional: true,
    placeholder: "123 Main Street",
  },
  ...getLocationFields({ section: undefined, startOrder: undefined }),
  {
    name: "zip",
    label: "ZIP Code",
    type: "text",
    optional: true,
    placeholder: "e.g. 90210",
    inputMode: "numeric",
    maxLength: 10,
  },
];
