import React from "react";

export default function BarChart({ data, color = "var(--color-primary)", height = 80 }) {
  if (!data || Object.keys(data).length === 0) return null;
  const maxVal = Math.max(...Object.values(data));
  const keys = Object.keys(data).sort();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height }}>
      {keys.map((key) => {
        const val = data[key];
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        return (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: 600 }}>{val}</div>
            <div style={{
              width: "100%",
              height: `${Math.max(4, pct)}%`,
              background: color,
              borderRadius: "3px 3px 0 0",
              minHeight: val > 0 ? 4 : 0,
              transition: "height 0.5s ease",
            }} />
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>{key}</div>
          </div>
        );
      })}
    </div>
  );
}
