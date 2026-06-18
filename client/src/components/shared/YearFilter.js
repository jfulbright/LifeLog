import React from "react";

/**
 * Standard Year filter pill row, shared across category lists and aggregate
 * pages (Timeline, My Memories, Shared, Recommendations). Reuses the
 * `.status-toggle` pill styling so it matches the Attended/Wishlist row.
 *
 * Renders nothing unless there are at least two years to choose between — a
 * single-year list gains nothing from a year filter.
 */
function YearFilter({ years, value, onChange }) {
  if (!years || years.length < 2) return null;

  return (
    <div className="status-toggle mb-2" role="group" aria-label="Year filter">
      <button
        type="button"
        className={`btn btn-sm ${value === "all" ? "active" : ""}`}
        onClick={() => onChange("all")}
      >
        All
      </button>
      {years.map((year) => (
        <button
          key={year}
          type="button"
          className={`btn btn-sm ${value === String(year) ? "active" : ""}`}
          onClick={() => onChange(String(year))}
        >
          {year}
        </button>
      ))}
    </div>
  );
}

export default YearFilter;
