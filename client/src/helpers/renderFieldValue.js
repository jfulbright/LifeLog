import React from "react";
import StarRating from "../components/shared/StarRating";

export function renderFieldValue(field, value) {
  if (value == null || value === "") return null;

  if (field.renderAs === "stars") {
    return <StarRating rating={value} />;
  }

  if (field.isLink && typeof value === "string") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>
        View link
      </a>
    );
  }

  if (field.isCurrency && typeof value === "number") {
    return `$${value.toLocaleString()}`;
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return String(value);
}
