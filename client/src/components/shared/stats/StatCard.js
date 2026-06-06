import React from "react";

export default function StatCard({ label, value, sub, color = "var(--color-primary)" }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      padding: "1.25rem",
      textAlign: "center",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, marginTop: "0.25rem", color: "var(--color-text-primary)" }}>{label}</div>
      {sub && <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}
