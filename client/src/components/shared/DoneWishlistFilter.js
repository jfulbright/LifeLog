import React from "react";

/**
 * Unified status filter for mixed-category pages (Timeline, My Memories) where
 * each category's "realized" state has a different label (visited/attended/
 * watched/owned/tried/done). Collapses them to the common pair Done vs Wishlist:
 *   - "wishlist"  → status === "wishlist"
 *   - "done"      → anything else (the realized state)
 *
 * Reuses the `.status-toggle` pill styling; data-status drives the accent color
 * (done = the realized/"attended" color, wishlist = the wishlist color).
 */
const OPTIONS = [
  { id: "all", label: "All" },
  { id: "done", label: "Done" },
  { id: "wishlist", label: "Wishlist" },
];

export function matchesDoneWishlist(status, filter) {
  if (filter === "all") return true;
  if (filter === "wishlist") return status === "wishlist";
  return status !== "wishlist"; // "done"
}

function DoneWishlistFilter({ value, onChange }) {
  return (
    <div className="status-toggle mb-3" role="group" aria-label="Status filter">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`btn btn-sm ${value === opt.id ? "active" : ""}`}
          data-status={opt.id === "all" ? undefined : opt.id === "wishlist" ? "wishlist" : "attended"}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default DoneWishlistFilter;
