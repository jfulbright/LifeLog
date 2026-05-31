import React, { useState } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import { RING_META, RING_LEVELS } from "../../helpers/ringMeta";
import Avatar from "./Avatar";

function PeopleListSearch({
  selectedContacts = [],
  selectedRings = [],
  onContactToggle,
  onRingToggle,
  showRings = true,
  showContacts = true,
  placeholder = "Search people…",
}) {
  const { contacts } = useAppData();
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredContacts = normalizedQuery
    ? contacts.filter((c) => c.displayName.toLowerCase().includes(normalizedQuery) || c.email.toLowerCase().includes(normalizedQuery))
    : contacts;

  const groupedByRing = RING_LEVELS.map((level) => ({
    level,
    meta: RING_META[level],
    contacts: filteredContacts.filter((c) => c.ringLevel === level),
  })).filter((g) => g.contacts.length > 0);

  return (
    <div style={{ maxHeight: 360, overflowY: "auto" }}>
      {showRings && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Select by ring
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {RING_LEVELS.map((level) => {
              const meta = RING_META[level];
              const active = selectedRings.includes(level);
              const count = contacts.filter((c) => c.ringLevel === level).length;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onRingToggle(level)}
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
                  {count > 0 && (
                    <span style={{ fontSize: "0.65rem", background: active ? "rgba(255,255,255,0.25)" : "var(--color-bg)", borderRadius: 8, padding: "0 0.3rem", fontWeight: 700 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showContacts && (
        <>
          <div style={{ marginBottom: "0.5rem" }}>
            <input
              type="text"
              className="form-control form-control-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
          </div>

          <div>
            {groupedByRing.map(({ level, meta, contacts: ringContacts }) => (
              <div key={level} style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: meta.color, marginBottom: "0.25rem" }}>
                  {meta.emoji} {meta.label}
                </div>
                {ringContacts.map((contact) => {
                  const selected = selectedContacts.includes(contact.id);
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => onContactToggle(contact.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        width: "100%",
                        padding: "0.375rem 0.5rem",
                        border: "none",
                        borderRadius: 6,
                        background: selected ? meta.bgColor : "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 100ms ease",
                      }}
                    >
                      <Avatar displayName={contact.displayName} color={meta.color} size={26} />
                      <span style={{ flex: 1, fontSize: "var(--font-size-sm)", fontWeight: selected ? 600 : 400, color: "var(--color-text-primary)" }}>
                        {contact.displayName}
                      </span>
                      {selected && (
                        <span style={{ color: meta.color, fontSize: "1rem" }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            {filteredContacts.length === 0 && (
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)", padding: "0.5rem", textAlign: "center" }}>
                No contacts found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PeopleListSearch;
