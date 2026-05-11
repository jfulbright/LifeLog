import React, { useState } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import ContactPicker from "./ContactPicker";
import { RING_META, RING_LEVELS } from "../../helpers/ringMeta";

/**
 * RecommendSection -- renders inside the entry form to let users target
 * recommendations to specific rings and/or individual contacts.
 *
 * Writes into formData:
 *   recommendedToRings: int[]     (e.g. [1, 2])
 *   recommendedToContacts: uuid[] (specific contact IDs)
 */
function RecommendSection({ formData, setFormData }) {
  const { contacts } = useAppData();
  const [expanded, setExpanded] = useState(false);

  const recommendedToRings = formData.recommendedToRings || [];
  const recommendedToContacts = formData.recommendedToContacts || [];

  const hasRecommendation = recommendedToRings.length > 0 || recommendedToContacts.length > 0;

  const toggleRing = (ringLevel) => {
    const next = recommendedToRings.includes(ringLevel)
      ? recommendedToRings.filter((r) => r !== ringLevel)
      : [...recommendedToRings, ringLevel];
    setFormData((prev) => ({ ...prev, recommendedToRings: next }));
  };

  const handleContactChange = (companions) => {
    const contactCompanions = companions.filter((c) => c.type === "contact");
    const ids = contactCompanions.map((c) => c.contactId);
    setFormData((prev) => ({
      ...prev,
      recommendedToContacts: ids,
      _recommendedCompanions: companions,
    }));
  };

  const contactPickerValue = (formData._recommendedCompanions || []).length > 0
    ? formData._recommendedCompanions
    : recommendedToContacts
        .map((id) => {
          const c = contacts.find((x) => x.id === id);
          return c ? { type: "contact", contactId: c.id, displayName: c.displayName } : null;
        })
        .filter(Boolean);

  const summaryParts = [
    ...recommendedToRings.map((r) => RING_META[r]?.label).filter(Boolean),
    ...(recommendedToContacts.length > 0
      ? [`${recommendedToContacts.length} ${recommendedToContacts.length === 1 ? "person" : "people"}`]
      : []),
  ];

  return (
    <div className="share-with-section">
      <button
        type="button"
        className="share-with-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="share-with-toggle-icon">{hasRecommendation ? "\u2B50" : "\u2606"}</span>
        <span className="share-with-toggle-label">
          {hasRecommendation
            ? `Recommending to ${summaryParts.join(", ")}`
            : "Recommend to my People"}
        </span>
        <span className="share-with-toggle-chevron" style={{ marginLeft: "auto" }}>
          {expanded ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      {expanded && (
        <div className="share-with-body">
          <div className="share-with-hint">
            Who should check this out? They'll see it as a recommendation in their feed.
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div className="share-with-sublabel">Recommend to rings</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {RING_LEVELS.map((level) => {
                const meta = RING_META[level];
                const active = recommendedToRings.includes(level);
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
            <div className="share-with-sublabel">Or pick people</div>
            <div style={{ marginTop: "0.5rem" }}>
              <ContactPicker
                value={contactPickerValue}
                onChange={handleContactChange}
                placeholder="Recommend to specific people\u2026"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendSection;

export function isRecommended(item) {
  return (
    (item.recommendedToRings && item.recommendedToRings.length > 0) ||
    (item.recommendedToContacts && item.recommendedToContacts.length > 0)
  );
}
