import React from "react";
import { useNavigate } from "react-router-dom";

/**
 * TripLink — renders a linked trip's name as a clickable affordance that deep
 * links to the trip's detail on the Travel page (`/travel?view=<tripId>`).
 *
 * Used anywhere an activity (or other entry) references a parent trip — the
 * compact card label and the read-only detail view — so the linking treatment
 * is identical everywhere. Falls back to plain text when there's no tripId.
 *
 * Props:
 *   tripId  — the linked trip's id (linkedTripId)
 *   title   — the trip's display name (linkedTripTitle)
 *   style   — optional style overrides merged onto the element
 */
function TripLink({ tripId, title, style }) {
  const navigate = useNavigate();
  if (!title) return null;

  const label = (
    <>
      {"✈️"} {title}
    </>
  );

  const baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "var(--font-size-xs)",
    ...style,
  };

  if (!tripId) {
    return (
      <span style={{ ...baseStyle, color: "var(--color-text-tertiary)" }}>
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="trip-link"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/travel?view=${tripId}`);
      }}
      style={{
        ...baseStyle,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        color: "var(--color-travel)",
        fontWeight: 600,
        textDecoration: "none",
      }}
    >
      {label}
    </button>
  );
}

export default TripLink;
