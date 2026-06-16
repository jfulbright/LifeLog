import React from "react";

const SOURCE_OPTIONS = [
  { id: "all", label: "All", emoji: null },
  { id: "mine", label: "Mine", emoji: null },
  { id: "shared", label: "Shared", emoji: "\u{1F91D}" },
  { id: "recommended", label: "Recommended", emoji: "⭐" },
];

function SourceFilterPills({ value, onChange, avatarUrl, sharedCount, recommendedCount }) {
  const sharedDisabled = typeof sharedCount === "number" && sharedCount === 0;
  const recDisabled = typeof recommendedCount === "number" && recommendedCount === 0;

  return (
    <div className="source-segment-track">
      {SOURCE_OPTIONS.map((opt) => {
        const isDisabled =
          (opt.id === "shared" && sharedDisabled) ||
          (opt.id === "recommended" && recDisabled);
        const isActive = value === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            className={`source-segment-btn ${isActive ? "active" : ""}`}
            disabled={isDisabled}
            style={isDisabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
            onClick={() => !isDisabled && onChange(opt.id)}
          >
            {opt.id === "mine" && avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover", marginRight: "0.3rem", verticalAlign: "middle" }}
              />
            ) : opt.id === "mine" ? (
              <span style={{ marginRight: "0.2rem" }}>👤</span>
            ) : opt.emoji ? (
              <span style={{ marginRight: "0.2rem" }}>{opt.emoji}</span>
            ) : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SourceFilterPills;
