import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../../contexts/AppDataContext";

/**
 * Live "incoming" summary for the landing timeline (C4, reused as A5).
 * Summarizes pending shares, recommendations, and connection requests with
 * click-through to their pages. Auto-updates via AppDataContext (which refreshes
 * on the `data-changed` event). Renders nothing when everything is at zero.
 */
function IncomingSummary() {
  const navigate = useNavigate();
  const { pendingCollaborations = 0, pendingRecommendations = 0, pendingConnections = 0 } = useAppData();

  const chips = [
    pendingCollaborations > 0 && { key: "shared", icon: "🤝", label: `${pendingCollaborations} shared with you`, to: "/shared" },
    pendingConnections > 0 && { key: "connect", icon: "👋", label: `${pendingConnections} connection ${pendingConnections === 1 ? "request" : "requests"}`, to: "/people" },
    pendingRecommendations > 0 && { key: "recs", icon: "⭐", label: `${pendingRecommendations} ${pendingRecommendations === 1 ? "recommendation" : "recommendations"}`, to: "/recommendations" },
  ].filter(Boolean);

  if (chips.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--card-radius, 8px)",
        padding: "0.75rem 0.875rem",
        marginBottom: "1rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: "var(--font-size-xs, 0.75rem)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Waiting for you
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => navigate(chip.to)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            background: "#fff",
            border: "1px solid var(--color-border)",
            borderRadius: 999,
            padding: "0.25rem 0.7rem",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            cursor: "pointer",
          }}
        >
          <span aria-hidden="true">{chip.icon}</span>
          {chip.label}
          <span aria-hidden="true" style={{ color: "var(--color-primary)" }}>{"→"}</span>
        </button>
      ))}
    </div>
  );
}

export default IncomingSummary;
