import React from "react";

export default function SectionHeader({ children, emoji }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-3" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
      {emoji && <span>{emoji}</span>}
      <h5 className="mb-0" style={{ fontWeight: 700 }}>{children}</h5>
    </div>
  );
}
