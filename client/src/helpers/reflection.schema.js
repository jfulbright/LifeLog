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
      label: "What's the first thing that comes to mind?",
      type: "textarea",
      maxLength: 140,
      placeholder: "Close your eyes and picture it\u2026",
      optional: true,
      visibleWhen: { status: experiencedStatus },
      section: "Snapshots",
      order: 31,
      fullWidth: true,
      isSnapshot: true,
    },
    {
      name: "snapshot2",
      label: "A small detail you don\u2019t want to lose",
      type: "textarea",
      maxLength: 140,
      placeholder: "The sound, the smell, the light\u2026",
      optional: true,
      visibleWhen: { status: experiencedStatus },
      section: "Snapshots",
      order: 32,
      fullWidth: true,
      isSnapshot: true,
    },
    {
      name: "snapshot3",
      label: "How did it make you feel?",
      type: "textarea",
      maxLength: 140,
      placeholder: "One sentence, your words\u2026",
      optional: true,
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
