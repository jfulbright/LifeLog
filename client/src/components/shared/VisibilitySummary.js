import React from "react";
import { RING_META } from "../../helpers/ringMeta";
import { getVisibilityScope } from "../../helpers/visibilitySharing";

const pill = (extra = {}) => ({
  display: "inline-block",
  borderRadius: 10,
  padding: "0.1rem 0.5rem",
  fontSize: "0.7rem",
  fontWeight: 700,
  ...extra,
});

/**
 * One-line "Who can see this" summary, scope-aware (issue #44):
 *   everyone → a single 🌐 Everyone pill
 *   private  → a single 🔒 Only you pill
 *   custom   → the selected ring pills + a "👤 N" people count
 */
function VisibilitySummary({ item, navigate }) {
  const scope = getVisibilityScope(item);
  const onClick = navigate ? () => navigate("/people") : undefined;
  const cursor = navigate ? { cursor: "pointer" } : {};

  if (scope === "everyone") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        <span style={pill({ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" })}>
          🌐 Everyone
        </span>
      </div>
    );
  }

  if (scope === "private") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        <span style={pill({ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" })}>
          🔒 Only you
        </span>
      </div>
    );
  }

  const rings = (item.visibilityRings || []).map((r) => RING_META[r]).filter(Boolean);
  const contactsCount = (item.visibilityContacts || []).length;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
      {rings.map((ring) => (
        <span key={ring.label} onClick={onClick} style={pill({ background: ring.bgColor, border: `1px solid ${ring.borderColor}`, color: ring.color, ...cursor })}>
          {ring.emoji} {ring.label}
        </span>
      ))}
      {contactsCount > 0 && (
        <span style={pill({ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" })}>
          👤 {contactsCount} {contactsCount === 1 ? "person" : "people"}
        </span>
      )}
    </div>
  );
}

export default VisibilitySummary;
