import { baseSchema } from "../../helpers/common.schema";
import { getStatusValues } from "../../helpers/statusLabels";
import { getReflectionFields, getCompanionsField } from "../../helpers/reflection.schema";

const movieSchema = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("movies"),
    required: true,
    section: "Main",
    order: 0,
  },
  {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
    placeholder: "e.g. The Shawshank Redemption",
    section: "Main",
    order: 1,
  },
  {
    name: "startDate",
    label: "Date Watched",
    type: "date",
    optional: true,
    section: "Main",
    order: 2,
  },
  {
    name: "year",
    label: "Year",
    type: "text",
    optional: true,
    placeholder: "e.g. 1994",
    section: "Details",
    order: 3,
  },
  {
    name: "genre",
    label: "Genre",
    type: "text",
    optional: true,
    placeholder: "e.g. Drama, Thriller",
    section: "Details",
    order: 4,
  },
  {
    name: "director",
    label: "Director",
    type: "text",
    optional: true,
    placeholder: "e.g. Frank Darabont",
    section: "Details",
    order: 5,
  },
  {
    name: "posterUrl",
    label: "Poster URL",
    type: "text",
    optional: true,
    hidden: true,
    section: "Hidden",
    order: 6,
  },
  {
    name: "tmdbId",
    label: "TMDB ID",
    type: "text",
    optional: true,
    hidden: true,
    section: "Hidden",
    order: 7,
  },
  {
    name: "overview",
    label: "Plot",
    type: "textarea",
    optional: true,
    placeholder: "Brief plot summary...",
    section: "Details",
    order: 8,
  },

  // Reflection fields (visible when status = "watched")
  ...getReflectionFields("watched"),

  // Social (Companions + Visibility + Recommend)
  getCompanionsField("watched"),
  {
    name: "visibilityControl",
    type: "visible-to",
    optional: true,
    section: "Social",
    order: 62,
    fullWidth: true,
  },
  {
    name: "recommendation",
    label: "Recommend this movie",
    type: "recommend",
    optional: true,
    section: "Social",
    order: 64,
  },

  // Tags
  ...baseSchema
    .filter((f) => f.name === "tags")
    .map((f) => ({ ...f, placeholder: "e.g. romcoms we would watch, date night, sci-fi classics", section: "Details", order: 50 })),

  ...baseSchema
    .filter((f) => ["createdAt", "section", "photoLink"].includes(f.name))
    .map((f) => ({ ...f, hidden: true })),
];

export default movieSchema;
