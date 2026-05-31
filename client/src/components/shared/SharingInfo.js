import React from "react";
import { RING_META } from "../../helpers/ringMeta";

function SharingInfo({ item, contacts, navigate }) {
  const rings = item.visibilityRings || [];
  if (rings.length === 0) return null;

  const ringLabels = rings.map((r) => RING_META[r]).filter(Boolean);
  if (ringLabels.length === 0) return null;

  const pillClick = navigate ? () => navigate("/people") : undefined;
  const pillStyle = navigate ? { cursor: "pointer" } : {};

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
        {"🔒"} Who can see this
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {ringLabels.map((ring) => (
          <span key={ring.label} onClick={pillClick} style={{ background: ring.bgColor, border: `1px solid ${ring.borderColor}`, borderRadius: 10, padding: "0.1rem 0.5rem", color: ring.color, fontWeight: 700, fontSize: "0.7rem", ...pillStyle }}>
            {ring.emoji} {ring.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default SharingInfo;
