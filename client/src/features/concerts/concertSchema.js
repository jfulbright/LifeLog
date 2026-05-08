import { baseSchema } from "../../helpers/common.schema";
import { locationSchema } from "../../helpers/location.schema";
import { getStatusValues } from "../../helpers/statusLabels";
import { getReflectionFields } from "../../helpers/reflection.schema";

const concertSchema = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("concerts"),
    required: true,
    section: "Main",
    order: 0,
  },
  {
    name: "artist",
    label: "Artist",
    type: "text",
    required: true,
    placeholder: "e.g. Coldplay",
    section: "Main",
    order: 1,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    section: "Main",
    order: 2,
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    optional: true,
    section: "Main",
    order: 3,
  },
  {
    name: "venue",
    label: "Venue",
    type: "text",
    optional: true,
    placeholder: "e.g. AT&T Stadium",
    section: "Details",
    order: 4,
  },
  {
    name: "tour",
    label: "Tour Name",
    type: "text",
    optional: true,
    placeholder: "e.g. Music of the Spheres Tour",
    section: "Details",
    order: 5,
  },
  {
    name: "setlist",
    label: "Setlist",
    type: "list",
    placeholder: "Song name",
    optional: true,
    section: "Details",
    order: 6,
  },
  {
    name: "sourceUrl",
    label: "Source URL",
    type: "url",
    optional: true,
    isLink: true,
    placeholder: "https://www.setlist.fm/...",
    section: "Details",
    order: 7,
  },

  ...locationSchema
    .filter((field) => !["street", "zip"].includes(field.name))
    .map((field, i) => ({
      ...field,
      section: "Location",
      order: 20 + i,
    })),

  ...getReflectionFields("attended"),

  ...baseSchema.filter(
    (field) =>
      !["status", "startDate", "endDate", "notes"].includes(field.name)
  ),
];

export default concertSchema;
