import React from "react";

function StarRating({ rating, max = 5, size, interactive, onChange }) {
  const filled = Math.min(parseInt(rating, 10) || 0, max);

  if (interactive && onChange) {
    return (
      <span style={{ fontSize: size || "var(--font-size-sm)", letterSpacing: "0.05em" }}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            onClick={() => onChange(i + 1)}
            style={{ cursor: "pointer", color: i < filled ? "#f5a623" : "var(--color-text-tertiary)" }}
          >
            {i < filled ? "★" : "☆"}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span style={{ color: "#f5a623", fontSize: size || "var(--font-size-xs)", letterSpacing: "0.02em" }}>
      {"★".repeat(filled)}
      {"☆".repeat(max - filled)}
    </span>
  );
}

export default StarRating;
