import React from "react";
import StarRating from "../components/shared/StarRating";

export function renderFieldValue(field, value) {
  if (value == null || value === "") return null;

  const displayAs = field.displayAs || field.renderAs;
  if (displayAs === "stars") {
    return <StarRating rating={value} />;
  }
  if (displayAs === "link") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
        View link
      </a>
    );
  }
  if (displayAs === "currency") {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (!isNaN(num)) return `$${num.toLocaleString()}`;
  }
  if (displayAs === "boolean") {
    return value ? "Yes" : "No";
  }
  if (displayAs === "pills" && Array.isArray(value)) {
    return (
      <span style={{ display: "inline-flex", gap: "0.25rem", flexWrap: "wrap" }}>
        {value.filter(Boolean).map((v, i) => (
          <span key={i} style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 }}>
            {typeof v === "object" ? v.name || v.displayName || String(v) : v}
          </span>
        ))}
      </span>
    );
  }

  if (field.isLink && typeof value === "string") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
        View link
      </a>
    );
  }

  if (field.isCurrency) {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (!isNaN(num)) return `$${num.toLocaleString()}`;
  }

  if (field.type === "toggle") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return String(value);
}
