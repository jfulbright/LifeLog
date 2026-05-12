import React, { useState } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import { RING_META, RING_LEVELS } from "../../helpers/ringMeta";

/**
 * ShareWithSection — controls passive browse visibility for an entry.
 * Writes `visibilityRings` (int[]) into formData.
 *
 * Visibility rules:
 *   An entry is browsable by user X if:
 *   1. X is the entry creator, OR
 *   2. X's ringLevel is in entry.visibilityRings
 *
 * NOTE: Individual co-experience sharing (pushing an entry to a specific person's
 * LifeLog) is handled by ShareWithCompanionsToggle in the Reflection section.
 * This component is browse-only (no push, no notification).
 */
function ShareWithSection({ formData, setFormData }) {
  const { contacts } = useAppData();
  const [expanded, setExpanded] = useState(false);

  const visibilityRings = formData.visibilityRings || [];
  const isVisible = visibilityRings.length > 0;

  const toggleRing = (ringLevel) => {
    const next = visibilityRings.includes(ringLevel)
      ? visibilityRings.filter((r) => r !== ringLevel)
      : [...visibilityRings, ringLevel];
    setFormData((prev) => ({ ...prev, visibilityRings: next }));
  };

  return (
    <div className="share-with-section">
      <h6 className="form-section-heading">Who can see this</h6>
      <button
        type="button"
        className="share-with-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="share-with-toggle-icon">{isVisible ? "👁" : "🔒"}</span>
        <span className="share-with-toggle-label">
          {isVisible
            ? `Visible to ${visibilityRings.map((r) => RING_META[r]?.label).join(", ")}`
            : "Private"}
        </span>
        <span className="share-with-toggle-chevron" style={{ marginLeft: "auto" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="share-with-body">
          <div className="share-with-hint">
            Choose who can see this entry when browsing your profile. Ring changes are not retroactive — they only affect this entry going forward.
          </div>

          <div className="share-with-sublabel" style={{ marginBottom: "0.5rem" }}>
            My People
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {RING_LEVELS.map((level) => {
              const meta = RING_META[level];
              const active = visibilityRings.includes(level);
              const ringContactCount = contacts.filter((c) => c.ringLevel === level).length;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleRing(level)}
                  aria-pressed={active}
                  style={{
                    background: active ? meta.color : "var(--color-surface)",
                    color: active ? "#fff" : "var(--color-text-secondary)",
                    border: `2px solid ${active ? meta.color : "var(--color-border)"}`,
                    borderRadius: 20,
                    padding: "0.375rem 1rem",
                    fontWeight: active ? 700 : 500,
                    fontSize: "var(--font-size-sm)",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  {meta.emoji} {meta.label}
                  {ringContactCount > 0 && (
                    <span
                      style={{
                        fontSize: "0.65rem",
                        background: active ? "rgba(255,255,255,0.25)" : "var(--color-bg)",
                        borderRadius: 8,
                        padding: "0 0.3rem",
                        fontWeight: 700,
                      }}
                    >
                      {ringContactCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareWithSection;
