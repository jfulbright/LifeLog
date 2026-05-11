import { getStatusValues } from "../../helpers/statusLabels";
import { getReflectionFields, getCompanionsField } from "../../helpers/reflection.schema";
import { baseSchema } from "../../helpers/common.schema";

export const KIDS_EVENT_TYPES = [
  { value: "school", label: "School" },
  { value: "sports", label: "Sports" },
  { value: "firsts", label: "Firsts" },
  { value: "performance", label: "Performance" },
  { value: "achievement", label: "Achievement" },
  { value: "life", label: "Life Milestone" },
  { value: "other", label: "Other" },
];

const kidsSchema = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: getStatusValues("kids"),
    required: true,
    section: "Main",
    order: 0,
  },
  {
    name: "milestoneType",
    label: "Milestone Type",
    type: "select",
    options: KIDS_EVENT_TYPES.map((t) => t.value),
    optionLabels: KIDS_EVENT_TYPES.reduce((acc, t) => {
      acc[t.value] = t.label;
      return acc;
    }, {}),
    required: true,
    section: "Main",
    order: 1,
  },
  {
    name: "childContactId",
    label: "Which child?",
    type: "child-picker",
    required: true,
    section: "Main",
    order: 2,
  },

  // ── School fields ───────────────────────────────────────────────────────────
  {
    name: "schoolName",
    label: "School",
    type: "text",
    optional: true,
    placeholder: "e.g. Lincoln Elementary",
    visibleWhen: { milestoneType: "school" },
    section: "Details",
    order: 10,
  },
  {
    name: "grade",
    label: "Grade / Year",
    type: "text",
    optional: true,
    placeholder: "e.g. 8th Grade, Senior Year",
    visibleWhen: { milestoneType: "school" },
    section: "Details",
    order: 11,
  },
  {
    name: "schoolEvent",
    label: "Event",
    type: "select",
    options: ["First Day", "Last Day", "Graduation", "Award", "Field Trip", "Conference", "Other"],
    optional: true,
    visibleWhen: { milestoneType: "school" },
    section: "Details",
    order: 12,
  },

  // ── Sports fields ──────────────────────────────────────────────────────────
  {
    name: "sport",
    label: "Sport",
    type: "text",
    optional: true,
    placeholder: "e.g. Soccer, Basketball, Swimming",
    visibleWhen: { milestoneType: "sports" },
    section: "Details",
    order: 10,
  },
  {
    name: "teamName",
    label: "Team",
    type: "text",
    optional: true,
    placeholder: "e.g. Wildcats",
    visibleWhen: { milestoneType: "sports" },
    section: "Details",
    order: 11,
  },
  {
    name: "season",
    label: "Season",
    type: "text",
    optional: true,
    placeholder: "e.g. Spring 2026",
    visibleWhen: { milestoneType: "sports" },
    section: "Details",
    order: 12,
  },
  {
    name: "position",
    label: "Position",
    type: "text",
    optional: true,
    placeholder: "e.g. Forward, Goalie",
    visibleWhen: { milestoneType: "sports" },
    section: "Details",
    order: 13,
  },
  {
    name: "sportsEvent",
    label: "Event",
    type: "select",
    options: ["Game", "Tournament", "Tryout", "Trophy/Award", "First Practice", "Other"],
    optional: true,
    visibleWhen: { milestoneType: "sports" },
    section: "Details",
    order: 14,
  },
  {
    name: "result",
    label: "Result / Score",
    type: "text",
    optional: true,
    placeholder: "e.g. Won 3-1, Made the team",
    visibleWhen: { milestoneType: "sports" },
    section: "Details",
    order: 15,
  },

  // ── Firsts fields ──────────────────────────────────────────────────────────
  {
    name: "firstWhat",
    label: "What was the first?",
    type: "text",
    required: true,
    placeholder: "e.g. First bike ride, First lost tooth, First date",
    visibleWhen: { milestoneType: "firsts" },
    section: "Details",
    order: 10,
  },
  {
    name: "significance",
    label: "How big is this?",
    type: "select",
    options: ["Everyday win", "Big deal", "Life-changing", "Once in a lifetime"],
    optional: true,
    visibleWhen: { milestoneType: "firsts" },
    section: "Details",
    order: 11,
  },

  // ── Performance fields ─────────────────────────────────────────────────────
  {
    name: "performanceType",
    label: "Type",
    type: "select",
    options: ["Dance", "Music", "Theater", "Talent Show", "Other"],
    optional: true,
    visibleWhen: { milestoneType: "performance" },
    section: "Details",
    order: 10,
  },
  {
    name: "performanceName",
    label: "Event / Show Name",
    type: "text",
    optional: true,
    placeholder: "e.g. Spring Recital, The Nutcracker",
    visibleWhen: { milestoneType: "performance" },
    section: "Details",
    order: 11,
  },
  {
    name: "role",
    label: "Role / Instrument",
    type: "text",
    optional: true,
    placeholder: "e.g. Clara, Piano, Ensemble",
    visibleWhen: { milestoneType: "performance" },
    section: "Details",
    order: 12,
  },

  // ── Achievement fields ─────────────────────────────────────────────────────
  {
    name: "achievementType",
    label: "Type",
    type: "select",
    options: ["Academic", "Athletic", "Personal", "Community", "Creative", "Other"],
    optional: true,
    visibleWhen: { milestoneType: "achievement" },
    section: "Details",
    order: 10,
  },
  {
    name: "achievementName",
    label: "Achievement",
    type: "text",
    optional: true,
    placeholder: "e.g. Honor Roll, Eagle Scout, Science Fair 1st Place",
    visibleWhen: { milestoneType: "achievement" },
    section: "Details",
    order: 11,
  },

  // ── Life Milestone fields (adult kids) ─────────────────────────────────────
  {
    name: "lifeMilestone",
    label: "What happened?",
    type: "text",
    required: true,
    placeholder: "e.g. Got first apartment, Started college, Got engaged",
    visibleWhen: { milestoneType: "life" },
    section: "Details",
    order: 10,
  },
  {
    name: "linkedEntryId",
    label: "Linked Entry ID",
    type: "text",
    optional: true,
    hidden: true,
    visibleWhen: { milestoneType: "life" },
  },
  {
    name: "linkedEntry",
    label: "Link to another entry",
    type: "linked-entry",
    optional: true,
    helperText: "Connect this to a Car, Home, or Travel entry",
    visibleWhen: { milestoneType: "life" },
    section: "Details",
    order: 11,
  },
  {
    name: "lifeSignificance",
    label: "How big is this?",
    type: "select",
    options: ["Everyday win", "Big deal", "Life-changing", "Once in a lifetime"],
    optional: true,
    visibleWhen: { milestoneType: "life" },
    section: "Details",
    order: 12,
  },

  // ── Other fields ───────────────────────────────────────────────────────────
  {
    name: "otherTitle",
    label: "What happened?",
    type: "text",
    required: true,
    placeholder: "Describe the milestone",
    visibleWhen: { milestoneType: "other" },
    section: "Details",
    order: 10,
  },

  // ── Shared fields (all sub-types) ─────────────────────────────────────────

  {
    name: "title",
    label: "Title",
    type: "text",
    optional: true,
    placeholder: "Short title for this milestone",
    section: "Main",
    order: 3,
  },
  {
    name: "ageAtEvent",
    label: "Age at time",
    type: "text",
    optional: true,
    readOnly: true,
    helperText: "Auto-calculated from child's birthday",
    section: "Main",
    order: 4,
  },

  // Dates
  ...baseSchema
    .filter((f) => ["startDate", "endDate"].includes(f.name))
    .map((f) => ({
      ...f,
      label: f.name === "startDate" ? "Date" : "End Date",
      section: "When",
      order: 20 + (f.name === "endDate" ? 1 : 0),
    })),

  // Location (optional)
  {
    name: "locationName",
    label: "Location",
    type: "text",
    optional: true,
    placeholder: "e.g. School auditorium, AT&T Stadium",
    section: "Where",
    order: 25,
  },

  // Reflection fields (visible when status = "happened")
  ...getReflectionFields("happened"),

  // Social
  getCompanionsField("happened"),
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
    label: "Recommend",
    type: "recommend",
    optional: true,
    section: "Social",
    order: 64,
  },

  // Tags + hidden fields
  ...baseSchema
    .filter((f) => f.name === "tags")
    .map((f) => ({ ...f, section: "Details", order: 50 })),

  ...baseSchema
    .filter((f) => ["createdAt", "section"].includes(f.name)),
];

export default kidsSchema;
