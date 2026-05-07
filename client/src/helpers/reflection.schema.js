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
      label: "\uD83D\uDCA1 Snap 1",
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
      label: "\uD83D\uDCA1 Snap 2",
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
      label: "\uD83D\uDCA1 Snap 3",
      type: "textarea",
      maxLength: 140,
      placeholder: "Add a quick memory\u2026",
      visibleWhen: { status: experiencedStatus },
      section: "Snapshots",
      order: 33,
      fullWidth: true,
      isSnapshot: true,
    },
    {
      name: "companions",
      label: "Who I was with",
      type: "list",
      placeholder: "Add a person",
      optional: true,
      visibleWhen: { status: experiencedStatus },
      section: "Snapshots",
      order: 34,
      fullWidth: true,
    },
  ];
}
