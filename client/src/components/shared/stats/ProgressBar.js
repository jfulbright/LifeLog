import React from "react";

export default function ProgressBar({ label, value, max, color = "var(--color-primary)", suffix = "" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between mb-1">
        <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          {value} / {max}{suffix}
        </span>
      </div>
      <div style={{ background: "var(--color-border)", borderRadius: 6, height: 10 }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 6,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.2rem" }}>
        {pct}%
      </div>
    </div>
  );
}
