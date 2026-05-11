/**
 * Shared "reflection" fields that any feature can spread into its schema.
 * Provides: 5-star rating, 3 Snapshots (140-char each), and companions.
 *
 * @param {string|string[]} experiencedStatus - The status value(s) that reveal
 *   these fields (e.g. "visited", "attended", ["owned", "rented"]).
 */
export function getReflectionFields(experiencedStatus) {
  return [
    {
      name: "rating",
      label: "Rating",
      type: "select",
      options: ["1", "2", "3", "4", "5"],
      renderAs: "stars",
      optional: true,
      visibleWhen: { status: experiencedStatus },
      section: "Reflection",
      order: 30,
    },
    {
      name: "snapshot1",
      label: "\u2728 Snap 1",
      type: "textarea",
      maxLength: 140,
      placeholder: "Add a quick memory\u2026",
      visibleWhen: { status: experiencedStatus },
      section: "Snapshots",
      order: 31,
      fullWidth: true,
      isSnapshot: true,
    },
    {
      name: "snapshot2",
      label: "\u2728 Snap 2",
      type: "textarea",
      maxLength: 140,
      placeholder: "Add a quick memory\u2026",
      visibleWhen: { status: experiencedStatus },
      section: "Snapshots",
      order: 32,
      fullWidth: true,
      isSnapshot: true,
    },
    {
      name: "snapshot3",
      label: "\u2728 Snap 3",
      type: "textarea",
      maxLength: 140,
      placeholder: "Add a quick memory\u2026",
      visibleWhen: { status: experiencedStatus },
      section: "Snapshots",
      order: 33,
      fullWidth: true,
      isSnapshot: true,
    },
    ...getPhotoFields(experiencedStatus),
  ];
}

/**
 * Companions field for the Social section. Separated from getReflectionFields
 * so it can be grouped with visibility and recommendation controls.
 */
export function getCompanionsField(experiencedStatus) {
  return {
    name: "companions",
    label: "Who was there?",
    type: "contact-list",
    placeholder: "Add from your people or type a name",
    optional: true,
    visibleWhen: { status: experiencedStatus },
    section: "Social",
    order: 60,
    fullWidth: true,
  };
}

/**
 * Three photo upload slots, shown once an entry is in an "experienced" status.
 * Mirrors the snapshot1/2/3 pattern. Included automatically by getReflectionFields().
 *
 * @param {string|string[]} experiencedStatus
 */
export function getPhotoFields(experiencedStatus) {
  return [
    {
      name: "photo1",
      label: "📷 Photo 1",
      type: "photo",
      visibleWhen: { status: experiencedStatus },
      section: "Photos",
      order: 34,
      optional: true,
      col: 4,
    },
    {
      name: "photo2",
      label: "📷 Photo 2",
      type: "photo",
      visibleWhen: { status: experiencedStatus },
      section: "Photos",
      order: 35,
      optional: true,
      col: 4,
    },
    {
      name: "photo3",
      label: "📷 Photo 3",
      type: "photo",
      visibleWhen: { status: experiencedStatus },
      section: "Photos",
      order: 36,
      optional: true,
      col: 4,
    },
  ];
}
