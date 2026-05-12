import React, { useState, useRef, useEffect, useCallback } from "react";

export const RATING_OPTIONS = [
  { value: "rating:5", label: "★★★★★" },
  { value: "rating:4+", label: "★★★★☆+" },
  { value: "rating:3+", label: "★★★☆☆+" },
  { value: "rating:unrated", label: "No rating" },
];

export const RATING_GROUP = {
  key: "rating",
  label: "★ Rating",
  options: RATING_OPTIONS,
};

/**
 * Reusable grouped dropdown filter with pill buttons that expand sub-option menus.
 *
 * Props:
 * - groups: [{ key, label, options: [{ value, label }] }]
 * - value: currently active filter value (string)
 * - onChange(value): called when user picks an option
 * - color: accent color for active pill (CSS variable or hex)
 * - allLabel: label for the reset pill (default "All")
 */
export default function GroupedDropdownFilter({
  groups,
  value,
  onChange,
  color = "var(--color-primary)",
  allLabel = "All",
}) {
  const [openGroup, setOpenGroup] = useState(null);
  const containerRef = useRef(null);
  const leaveTimerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => clearTimeout(leaveTimerRef.current);
  }, []);

  const handleMouseEnter = useCallback((groupKey) => {
    clearTimeout(leaveTimerRef.current);
    setOpenGroup(groupKey);
  }, []);

  const handleMouseLeave = useCallback((groupKey) => {
    leaveTimerRef.current = setTimeout(() => {
      setOpenGroup((current) => (current === groupKey ? null : current));
    }, 150);
  }, []);

  const isGroupActive = (group) =>
    group.options.some((opt) => opt.value === value);

  return (
    <div
      ref={containerRef}
      className="d-flex gap-2 flex-wrap mb-3"
      style={{ position: "relative" }}
    >
      <button
        type="button"
        onClick={() => { onChange("all"); setOpenGroup(null); }}
        style={{
          padding: "0.3rem 0.75rem",
          borderRadius: "20px",
          border: `2px solid ${color}`,
          background: value === "all" ? color : "transparent",
          color: value === "all" ? "#fff" : color,
          fontWeight: 600,
          fontSize: "var(--font-size-sm)",
          cursor: "pointer",
        }}
      >
        {allLabel}
      </button>

      {groups.map((group) => (
        <div
          key={group.key}
          style={{ display: "inline-block", position: "relative" }}
          onMouseEnter={() => handleMouseEnter(group.key)}
          onMouseLeave={() => handleMouseLeave(group.key)}
        >
          <button
            type="button"
            onClick={() =>
              setOpenGroup(openGroup === group.key ? null : group.key)
            }
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "20px",
              border: `2px solid ${color}`,
              background: isGroupActive(group) ? color : "transparent",
              color: isGroupActive(group) ? "#fff" : color,
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
              listStyle: "none",
            }}
          >
            {group.label}
          </button>

          {openGroup === group.key && (
            <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, paddingTop: 4 }}>
              <div
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--card-radius)",
                  padding: "0.5rem",
                  boxShadow: "var(--card-shadow-hover)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.25rem",
                  minWidth: 160,
                }}
              >
                {/* Per-group clear option */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange("all");
                    setOpenGroup(null);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "0.3rem 0.5rem",
                    border: "none",
                    background: value === "all" ? "var(--color-surface-hover)" : "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: value === "all" ? 700 : 400,
                    color: "var(--color-text-secondary)",
                    borderBottom: "1px solid var(--color-border)",
                    marginBottom: "0.25rem",
                    paddingBottom: "0.4rem",
                  }}
                >
                  All {group.label.replace(/^[^\w]*/, "")}
                </button>
                {group.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(opt.value);
                      setOpenGroup(null);
                    }}
                    style={{
                      textAlign: "left",
                      padding: "0.3rem 0.5rem",
                      border: "none",
                      background:
                        value === opt.value
                          ? "var(--color-surface-hover)"
                          : "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: value === opt.value ? 700 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
