// src/utils/commonSchema.js

export const baseSchema = [
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    optional: true,
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    optional: true,
  },
  {
    name: "tags",
    label: "Tags (comma separated)",
    type: "text",
    optional: true,
  },
  {
    name: "notes",
    label: "notes",
    type: "textarea",
    optional: true,
  },
  {
    name: "photoLink",
    label: "Photo Link",
    type: "text",
    optional: true,
    hidden: true,
    isLink: true,
  },
];
