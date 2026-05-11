import { baseSchema } from "../../helpers/common.schema";
import { getStatusValues } from "../../helpers/statusLabels";
import { getReflectionFields, getCompanionsField } from "../../helpers/reflection.schema";

export const EVENT_TYPES = [
  { value: "concert", label: "Concert" },
  { value: "sports", label: "Sports" },
  { value: "broadway", label: "Broadway / Theater" },
  { value: "comedy", label: "Comedy" },
  { value: "festival", label: "Festival" },
  { value: "other", label: "Other" },
];

const eventSchema = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("events"),
    required: true,
    section: "Main",
    order: 0,
  },
  {
    name: "eventType",
    label: "Event Type",
    type: "select",
    options: EVENT_TYPES.map((t) => t.value),
    optionLabels: EVENT_TYPES.reduce((acc, t) => {
      acc[t.value] = t.label;
      return acc;
    }, {}),
    required: true,
    section: "Main",
    order: 1,
  },

  // ── Concert fields ──────────────────────────────────────────────────────────
  {
    name: "artist",
    label: "Artist",
    type: "text",
    required: true,
    placeholder: "e.g. Coldplay",
    visibleWhen: { eventType: "concert" },
    section: "Main",
    order: 2,
  },
  {
    name: "tour",
    label: "Tour Name",
    type: "text",
    optional: true,
    placeholder: "e.g. Music of the Spheres Tour",
    visibleWhen: { eventType: "concert" },
    section: "Details",
    order: 51,
  },
  {
    name: "setlist",
    label: "Setlist",
    type: "list",
    placeholder: "Song name",
    optional: true,
    visibleWhen: { eventType: "concert" },
    section: "Details",
    order: 52,
  },
  {
    name: "sourceUrl",
    label: "Source URL",
    type: "url",
    optional: true,
    isLink: true,
    placeholder: "https://www.setlist.fm/...",
    visibleWhen: { eventType: "concert" },
    section: "Details",
    order: 53,
  },

  // ── Sports fields ───────────────────────────────────────────────────────────
  {
    name: "sport",
    label: "Sport",
    type: "select",
    options: ["football", "basketball", "baseball", "hockey", "soccer", "tennis", "golf", "mma", "other"],
    optionLabels: {
      football: "Football",
      basketball: "Basketball",
      baseball: "Baseball",
      hockey: "Hockey",
      soccer: "Soccer",
      tennis: "Tennis",
      golf: "Golf",
      mma: "MMA / Boxing",
      other: "Other",
    },
    required: true,
    visibleWhen: { eventType: "sports" },
    section: "Main",
    order: 2,
  },
  {
    name: "teams",
    label: "Teams / Matchup",
    type: "text",
    placeholder: "e.g. Cowboys vs Eagles",
    required: true,
    visibleWhen: { eventType: "sports" },
    section: "Main",
    order: 3,
  },
  {
    name: "league",
    label: "League",
    type: "text",
    optional: true,
    placeholder: "e.g. NFL, NBA, Premier League",
    visibleWhen: { eventType: "sports" },
    section: "Details",
    order: 51,
  },
  {
    name: "score",
    label: "Score / Result",
    type: "text",
    optional: true,
    placeholder: "e.g. 27-24 W",
    visibleWhen: { eventType: "sports" },
    section: "Details",
    order: 52,
  },
  {
    name: "seatSection",
    label: "Seat / Section",
    type: "text",
    optional: true,
    placeholder: "e.g. Section 214, Row 8",
    visibleWhen: { eventType: "sports" },
    section: "Details",
    order: 53,
  },

  // ── Broadway / Theater fields ───────────────────────────────────────────────
  {
    name: "showName",
    label: "Show Name",
    type: "text",
    required: true,
    placeholder: "e.g. Hamilton",
    visibleWhen: { eventType: "broadway" },
    section: "Main",
    order: 2,
  },
  {
    name: "theater",
    label: "Theater",
    type: "text",
    optional: true,
    placeholder: "e.g. Richard Rodgers Theatre",
    visibleWhen: { eventType: "broadway" },
    section: "Details",
    order: 51,
  },
  {
    name: "seats",
    label: "Seats",
    type: "text",
    optional: true,
    placeholder: "e.g. Orchestra, Row F",
    visibleWhen: { eventType: "broadway" },
    section: "Details",
    order: 52,
  },
  {
    name: "castHighlights",
    label: "Cast Highlights",
    type: "text",
    optional: true,
    placeholder: "Notable performers in this show",
    visibleWhen: { eventType: "broadway" },
    section: "Details",
    order: 53,
  },

  // ── Comedy fields ───────────────────────────────────────────────────────────
  {
    name: "comedian",
    label: "Comedian",
    type: "text",
    required: true,
    placeholder: "e.g. John Mulaney",
    visibleWhen: { eventType: "comedy" },
    section: "Main",
    order: 2,
  },
  {
    name: "specialName",
    label: "Special / Tour Name",
    type: "text",
    optional: true,
    placeholder: "e.g. From Scratch Tour",
    visibleWhen: { eventType: "comedy" },
    section: "Details",
    order: 51,
  },

  // ── Festival fields ─────────────────────────────────────────────────────────
  {
    name: "festivalName",
    label: "Festival Name",
    type: "text",
    required: true,
    placeholder: "e.g. Coachella, SXSW",
    visibleWhen: { eventType: "festival" },
    section: "Main",
    order: 2,
  },
  {
    name: "lineup",
    label: "Acts Seen",
    type: "list",
    placeholder: "Artist or act name",
    optional: true,
    visibleWhen: { eventType: "festival" },
    section: "Details",
    order: 51,
  },

  // ── Other fields ────────────────────────────────────────────────────────────
  {
    name: "eventName",
    label: "Event Name",
    type: "text",
    required: true,
    placeholder: "e.g. Comic-Con, TED Talk",
    visibleWhen: { eventType: "other" },
    section: "Main",
    order: 2,
  },
  {
    name: "eventDescription",
    label: "Description",
    type: "text",
    optional: true,
    placeholder: "What kind of event was this?",
    visibleWhen: { eventType: "other" },
    section: "Details",
    order: 51,
  },

  // ── Shared: Venue (concerts, comedy, sports, other) ─────────────────────────
  {
    name: "venue",
    label: "Venue",
    type: "text",
    optional: true,
    placeholder: "e.g. Madison Square Garden",
    visibleWhen: { eventType: ["concert", "comedy", "sports", "festival", "other"] },
    section: "Details",
    order: 50,
  },

  // ── When ───────────────────────────────────────────────────────────────────
  {
    name: "startDate",
    label: "Date",
    type: "date",
    section: "When",
    order: 20,
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    optional: true,
    section: "When",
    order: 21,
  },

  // ── Where ─────────────────────────────────────────────────────────────────
  {
    name: "country",
    label: "Country",
    type: "select",
    optional: true,
    defaultValue: "US",
    section: "Where",
    order: 25,
  },
  {
    name: "city",
    label: "City",
    type: "city-autocomplete",
    optional: true,
    placeholder: "e.g. Austin",
    section: "Where",
    order: 26,
  },
  {
    name: "state",
    label: "State / Region",
    type: "state-or-region",
    optional: true,
    section: "Where",
    order: 27,
  },
  { name: "lat", label: "Lat", type: "text", hidden: true },
  { name: "lng", label: "Lng", type: "text", hidden: true },
  { name: "continent", label: "Continent", type: "text", hidden: true },

  // ── Trip ──────────────────────────────────────────────────────────────────
  { name: "linkedTripId", label: "Linked Trip ID", type: "text", hidden: true },
  {
    name: "linkedTrip",
    label: "Part of a Trip",
    type: "linked-trip",
    optional: true,
    helperText: "Link this to a trip in your Travel log",
    section: "Trip",
    order: 49,
    visibleWhen: { status: "attended" },
  },

  // ── Reflection (Rating, Snapshots, Photos) ────────────────────────────────
  ...getReflectionFields("attended"),

  // ── Social (Companions + Visibility + Recommend) ──────────────────────────
  getCompanionsField("attended"),
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
    label: "Recommend this",
    type: "recommend",
    optional: true,
    section: "Social",
    order: 64,
  },

  // ── Base fields (tags, hidden metadata) ─────────────────────────────────────
  ...baseSchema
    .filter((field) => !["status", "startDate", "endDate", "notes"].includes(field.name))
    .map((field) =>
      field.name === "tags" ? { ...field, order: 54 } : field
    ),
];

export default eventSchema;
