import React, { useState, useEffect } from "react";
import { RING_META } from "../../helpers/ringMeta";
import { getPeopleWithCollabStatus } from "../../helpers/peopleDisplay";
import collaboratorService from "../../services/collaboratorService";
import WhoWasTherePills from "./WhoWasTherePills";

function ReadOnlySocialSection({ item, contacts }) {
  const [collaborators, setCollaborators] = useState([]);

  useEffect(() => {
    if (!item?.id) return;
    let cancelled = false;
    collaboratorService.getCollaboratorsForEntry(item.id).then((rows) => {
      if (!cancelled) setCollaborators(rows);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [item?.id]);

  const people = getPeopleWithCollabStatus(item.companions, collaborators, contacts);
  const hasPeople = people.length > 0;
  const visibilityRings = item.visibilityRings || [];

  if (!hasPeople && visibilityRings.length === 0) return null;

  const sectionStyle = {
    marginBottom: "1rem",
    padding: "0.75rem",
    background: "var(--color-surface-hover, #f9f9f9)",
    borderRadius: 8,
    border: "1px solid var(--color-border, #e0e0e0)",
  };
  const labelStyle = {
    fontSize: "var(--font-size-xs, 0.75rem)",
    fontWeight: 600,
    color: "var(--color-text-secondary, #696969)",
    marginBottom: "0.375rem",
  };

  return (
    <div style={sectionStyle}>
      <div style={{ fontSize: "var(--font-size-xs, 0.75rem)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        People & Visibility
      </div>
      {hasPeople && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={labelStyle}>{"👥"} Who was there?</div>
          <WhoWasTherePills people={people} />
        </div>
      )}
      <div>
        <div style={labelStyle}>{"🔒"} Who can see this</div>
        {visibilityRings.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {visibilityRings.map((ringLevel) => {
              const ring = RING_META[ringLevel];
              if (!ring) return null;
              return (
                <span key={ringLevel} style={{ background: ring.bgColor, border: `1px solid ${ring.borderColor}`, borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", color: ring.color, fontWeight: 600 }}>
                  {ring.emoji} {ring.label}
                </span>
              );
            })}
          </div>
        ) : (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
            Private (only collaborators)
          </span>
        )}
      </div>
    </div>
  );
}

export default ReadOnlySocialSection;
