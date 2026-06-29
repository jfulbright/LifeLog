import React, { useState, useEffect } from "react";
import { getPeopleWithCollabStatus } from "../../helpers/peopleDisplay";
import collaboratorService from "../../services/collaboratorService";
import WhoWasTherePills from "./WhoWasTherePills";
import VisibilitySummary from "./VisibilitySummary";

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
        <VisibilitySummary item={item} />
      </div>
    </div>
  );
}

export default ReadOnlySocialSection;
