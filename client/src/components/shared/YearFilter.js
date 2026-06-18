import React from "react";

/**
 * Standard Year filter pill row, shared across category lists and aggregate
 * pages (Timeline, My Memories, Shared, Recommendations). Reuses the
 * `.status-toggle` pill styling so it matches the Attended/Wishlist row.
 *
 * Renders nothing only when there are no dated items at all; a single year still
 * shows (All + that year) so the control is present wherever any data exists.
 */
function YearFilter({ years, value, onChange }) {
  if (!years || years.length < 1) return null;

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
