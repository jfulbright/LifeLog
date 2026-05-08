import React from "react";
import { getStatusLabel } from "../../helpers/filterUtils";

/**
 * Reusable pill-style status filter toggle.
 * Replaces raw <select> dropdowns across all category pages.
 */
function StatusToggle({ category, options, value, onChange }) {
  return (
    <div className="status-toggle mb-3" role="group" aria-label="Status filter">
      {options.map((status) => (
        <button
          key={status}
          type="button"
          className={`btn btn-sm ${value === status ? "active" : ""}`}
          onClick={() => onChange(status)}
        >
          {getStatusLabel(category, status)}
        </button>
      ))}
    </div>
  );
}

export default StatusToggle;
