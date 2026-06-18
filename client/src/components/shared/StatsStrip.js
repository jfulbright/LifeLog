import React from "react";
import { Link } from "react-router-dom";

function StatsStrip({ stats, icon, statsLink }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div style={{
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      alignItems: "center",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius, 8px)",
      padding: "0.55rem 1rem",
      marginBottom: "0.75rem",
      fontSize: "var(--font-size-sm)",
    }}>
      {icon && <span style={{ fontSize: "1rem", lineHeight: 1 }}>{icon}</span>}
      {stats.map((stat, i) => (
        <React.Fragment key={i}>
          {(i > 0 || icon) && (
            <span style={{ color: "var(--color-text-tertiary)" }}>&middot;</span>
          )}
          <span style={{ fontWeight: 800, color: stat.color || "var(--color-primary)" }}>
            {stat.value}
          </span>
          <span style={{ color: "var(--color-text-secondary)" }}>
            {stat.label}
          </span>
        </React.Fragment>
      ))}
      {statsLink && (
        <Link
          to={statsLink.to}
          style={{
            marginLeft: "auto",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: statsLink.color || "var(--color-primary)",
            textDecoration: "none",
            whiteSpace: "nowrap",
            padding: "0.1rem 0.4rem",
            borderRadius: 4,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          Full Stats &rarr;
        </Link>
      )}
    </div>
  );
}

export default StatsStrip;
