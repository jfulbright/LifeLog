import React, { useState } from "react";
import { RING_META, RING_LEVELS } from "../../helpers/ringMeta";
import PeopleListSearch from "./PeopleListSearch";

function VisibilityPicker({ formData, setFormData }) {
  const [expanded, setExpanded] = useState(false);

  const visibilityRings = formData.visibilityRings || [];
  const isVisible = visibilityRings.length > 0;

  const toggleRing = (ringLevel) => {
    const next = visibilityRings.includes(ringLevel)
      ? visibilityRings.filter((r) => r !== ringLevel)
      : [...visibilityRings, ringLevel];
    setFormData((prev) => ({ ...prev, visibilityRings: next }));
  };

  const allSelected = RING_LEVELS.every((l) => visibilityRings.includes(l));
  const toggleAll = () => {
    const next = allSelected ? [] : [...RING_LEVELS];
    setFormData((prev) => ({ ...prev, visibilityRings: next }));
  };

  return (
    <div className="share-with-section">
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

          <div style={{ marginBottom: "0.5rem" }}>
            <button
              type="button"
              onClick={toggleAll}
              aria-pressed={allSelected}
              style={{
                background: allSelected ? "var(--color-primary)" : "var(--color-surface)",
                color: allSelected ? "#fff" : "var(--color-text-secondary)",
                border: `2px solid ${allSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                borderRadius: 20,
                padding: "0.375rem 1rem",
                fontWeight: allSelected ? 700 : 500,
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
                transition: "all 150ms ease",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                marginBottom: "0.5rem",
              }}
            >
              🌐 Everyone
            </button>
          </div>

          <PeopleListSearch
            selectedContacts={[]}
            selectedRings={visibilityRings}
            onContactToggle={() => {}}
            onRingToggle={toggleRing}
            showRings={true}
            showContacts={false}
          />
        </div>
      )}
    </div>
  );
}

export default VisibilityPicker;
