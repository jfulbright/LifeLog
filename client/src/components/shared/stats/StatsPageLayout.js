import React from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import StatCard from "./StatCard";

const PERIOD_OPTIONS = [
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
  { value: "6mo", label: "Last 6 Months" },
];

export default function StatsPageLayout({
  title,
  emoji,
  subtitle,
  backLabel,
  backTo,
  color = "var(--color-primary)",
  periodFilter = "year",
  onPeriodChange,
  heroStats,
  children,
}) {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0" style={{ fontWeight: 700 }}>{emoji} {title}</h4>
          {subtitle && (
            <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "0.2rem" }}>
              {subtitle}
            </div>
          )}
        </div>
        <Link to={backTo} className="btn btn-sm btn-outline-secondary">
          {backLabel}
        </Link>
      </div>

      {onPeriodChange && (
        <div className="d-flex gap-2 mb-3">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPeriodChange(opt.value)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "20px",
                border: `2px solid ${color}`,
                background: periodFilter === opt.value ? color : "transparent",
                color: periodFilter === opt.value ? "#fff" : color,
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {heroStats && heroStats.length > 0 && (
        <Row className="g-3 mb-4">
          {heroStats.map((stat, i) => (
            <Col xs={6} md={3} key={i}>
              <StatCard {...stat} />
            </Col>
          ))}
        </Row>
      )}

      {children}
    </div>
  );
}
