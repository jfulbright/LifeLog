import React from "react";
import { RING_META } from "../../helpers/ringMeta";

/**
 * Single merged "Who was there?" pill list. Each person shows once; people you
 * collaborate with get a 🤝 and keep their (Pending) status (issue #53).
 * Expects the merged array from getPeopleWithCollabStatus().
 */
function WhoWasTherePills({ people }) {
  if (!Array.isArray(people) || people.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
      {people.map((person) => {
        const ring = person.ringLevel ? RING_META[person.ringLevel] : null;
        const isPending = person.isCollaborator && person.status === "pending";
        const leadEmoji = person.isCollaborator ? "🤝 " : ring ? `${ring.emoji} ` : "";
        return (
          <span
            key={person.key}
            style={{
              background: isPending ? "var(--color-warning-bg, #FFF3CD)" : ring ? ring.bgColor : "var(--color-surface-hover)",
              border: `1px solid ${isPending ? "var(--color-warning, #ECB22E)" : ring ? ring.borderColor : "var(--color-border)"}`,
              borderRadius: 10,
              padding: "0.1rem 0.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              color: isPending ? "var(--color-warning-text, #856404)" : ring ? ring.color : "var(--color-text-secondary)",
              opacity: isPending ? 0.9 : 1,
            }}
          >
            {leadEmoji}{person.displayName}{isPending ? " (Pending)" : ""}
          </span>
        );
      })}
    </div>
  );
}

export default WhoWasTherePills;
