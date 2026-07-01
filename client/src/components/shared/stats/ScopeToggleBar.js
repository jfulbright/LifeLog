import React from "react";
import { RING_META } from "../../../helpers/ringMeta";

function ScopePill({ active, onClick, label, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1.5px solid ${active ? accent : "var(--color-border)"}`,
        background: active ? accent : "var(--color-surface)",
        color: active ? "#fff" : "var(--color-text-secondary)",
        borderRadius: 16,
        padding: "0.2rem 0.7rem",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

/**
 * "Whose stats" scope toggle row (Epic D / D4). Renders Mine / My Circle /
 * In-common (when there are overlaps) / one pill per contact who has shared
 * items. Pairs with useScopeToggle. Renders nothing when there are no linked
 * contacts with shared items.
 */
function ScopeToggleBar({ scopeContacts, activeScope, setScope, inCommonCount = 0, color = "var(--color-primary)" }) {
  if (!scopeContacts || scopeContacts.length === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
      <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "0.25rem" }}>
        Whose stats
      </span>
      <ScopePill active={activeScope === "mine"} onClick={() => setScope("mine")} label={"🧑 Mine"} accent={color} />
      <ScopePill active={activeScope === "circle"} onClick={() => setScope("circle")} label={"👥 My Circle"} accent={color} />
      {inCommonCount > 0 && (
        <ScopePill active={activeScope === "together"} onClick={() => setScope("together")} label={"🤝 In common"} accent={color} />
      )}
      {scopeContacts.map((c) => (
        <ScopePill
          key={c.uid}
          active={activeScope === c.uid}
          onClick={() => setScope(c.uid)}
          label={c.name}
          accent={RING_META[c.ring]?.color || color}
        />
      ))}
    </div>
  );
}

export default ScopeToggleBar;
