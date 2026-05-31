import React from "react";
import { RING_META } from "../../helpers/ringMeta";

function PeoplePills({ people, contacts }) {
  if (!Array.isArray(people) || people.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
      {people.map((entry, i) => {
        if (typeof entry === "string") {
          return (
            <span key={i} style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {entry}
            </span>
          );
        }
        if (entry.type === "contact") {
          const contact = contacts.find((c) => c.id === entry.contactId);
          const ring = contact ? RING_META[contact.ringLevel] : null;
          return (
            <span key={i} style={{ background: ring ? ring.bgColor : "var(--color-surface-hover)", border: `1px solid ${ring ? ring.borderColor : "var(--color-border)"}`, borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", color: ring ? ring.color : "var(--color-text-primary)", fontWeight: 600 }}>
              {ring ? ring.emoji + " " : ""}{entry.displayName}
            </span>
          );
        }
        return (
          <span key={i} style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", fontWeight: 600 }}>
            {entry.name}
          </span>
        );
      })}
    </div>
  );
}

export default PeoplePills;
