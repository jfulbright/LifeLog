import React from "react";

export default function HorizontalBar({ items, color = "var(--color-primary)", maxVal, limit }) {
  if (!items || items.length === 0) return null;
  const display = limit ? items.slice(0, limit) : items;
  const max = maxVal || Math.max(...display.map((i) => i.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {display.map((item) => (
        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ minWidth: 90, fontSize: "var(--font-size-sm)", fontWeight: 600, textAlign: "right" }}>
            {item.name}
          </span>
          <div style={{ flex: 1, background: "var(--color-border)", borderRadius: 4, height: 18, position: "relative" }}>
            <div style={{
              width: `${max > 0 ? (item.count / max) * 100 : 0}%`,
              height: "100%",
              background: color,
              borderRadius: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", minWidth: 20 }}>
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
