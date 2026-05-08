import React, { useState } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import ContactPicker from "./ContactPicker";
import { RING_META, RING_LEVELS } from "../../helpers/ringMeta";

/**
 * ShareWithSection — renders inside the entry form as the last section.
 * Writes `visibilityRings` (int[]) and `taggedContactIds` (uuid[]) into formData.
 *
 * Sharing rules:
 *   An entry is visible to user X if any of these are true:
 *   1. X is the entry creator
 *   2. X's contactId is in entry.taggedContactIds
 *   3. X's ringLevel is in entry.visibilityRings
 */
function ShareWithSection({ formData, setFormData }) {
  const { contacts } = useAppData();
  const [expanded, setExpanded] = useState(false);

  const visibilityRings = formData.visibilityRings || [];
  const taggedContactIds = formData.taggedContactIds || [];

  const isShared = visibilityRings.length > 0 || taggedContactIds.length > 0;

  const toggleRing = (ringLevel) => {
    const next = visibilityRings.includes(ringLevel)
      ? visibilityRings.filter((r) => r !== ringLevel)
      : [...visibilityRings, ringLevel];
    setFormData((prev) => ({ ...prev, visibilityRings: next }));
  };

  const handleTaggedChange = (companions) => {
    const contactCompanions = companions.filter((c) => c.type === "contact");
    const ids = contactCompanions.map((c) => c.contactId);
    setFormData((prev) => ({
      ...prev,
      taggedContactIds: ids,
      _taggedCompanions: companions,
    }));
  };

  const taggedCompanionValue = (formData._taggedCompanions || []).length > 0
    ? formData._taggedCompanions
    : taggedContactIds
        .map((id) => {
          const c = contacts.find((x) => x.id === id);
          return c ? { type: "contact", contactId: c.id, displayName: c.displayName } : null;
        })
        .filter(Boolean);

  return (
    <div className="share-with-section">
      <button
        type="button"
        className="share-with-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="share-with-toggle-icon">{isShared ? "🤝" : "🔒"}</span>
        <span className="share-with-toggle-label">
          {isShared
            ? `Sharing with ${[
                ...visibilityRings.map((r) => RING_META[r]?.label),
                ...(taggedContactIds.length > 0
                  ? [`${taggedContactIds.length} tagged`]
                  : []),
              ].join(", ")}`
            : "Only Me (private)"}
        </span>
        <span className="share-with-toggle-chevron" style={{ marginLeft: "auto" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="share-with-body">
          <div className="share-with-hint">
            Selecting a ring shares with everyone in that ring. Ring changes are not retroactive — they only affect this entry going forward.
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div className="share-with-sublabel">Ring visibility</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
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

          <div>
            <div className="share-with-sublabel">Also tag individually</div>
            <div style={{ marginTop: "0.5rem" }}>
              <ContactPicker
                value={taggedCompanionValue}
                onChange={handleTaggedChange}
                placeholder="Tag specific people beyond the ring…"
              />
            </div>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-tertiary)",
                marginTop: "0.375rem",
              }}
            >
              Tagged people see this entry immediately and can add their own snapshots.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareWithSection;
