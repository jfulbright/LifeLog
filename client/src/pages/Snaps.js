import React, { useState } from "react";
import { Link } from "react-router-dom";
import categoryMeta from "helpers/categoryMeta";
import { getAllSnapshots } from "helpers/operator";
import dataService, { STORAGE_KEYS } from "services/dataService";

const categories = Object.keys(STORAGE_KEYS).map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

function Snaps() {
  const [activeFilter, setActiveFilter] = useState("all");

  const allSnaps = categories.flatMap((cat) => {
    const meta = categoryMeta[cat.key] || {};
    return dataService.getItems(cat.key).flatMap((item) => {
      const snaps = getAllSnapshots(item);
      if (snaps.length === 0) return [];
      const title =
        item[meta.primaryField] ||
        item.artist ||
        item.title ||
        item.type ||
        item.make ||
        "Untitled";
      const date = item.startDate || item.createdAt || "";
      return snaps.map((text, i) => ({
        text,
        title,
        category: cat.key,
        label: cat.label,
        icon: meta.icon,
        color: meta.color,
        date,
        key: `${cat.key}-${title}-${i}`,
      }));
    });
  });

  const filtered =
    activeFilter === "all"
      ? allSnaps
      : allSnaps.filter((s) => s.category === activeFilter);

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h4 className="mb-4" style={{ fontWeight: 700 }}>Snapshots</h4>

      {/* Category filter pills */}
      <div className="status-toggle mb-4">
        <button
          className={`btn ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>
        {categories.map((cat) => {
          const meta = categoryMeta[cat.key] || {};
          const count = allSnaps.filter((s) => s.category === cat.key).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.key}
              className={`btn ${activeFilter === cat.key ? "active" : ""}`}
              onClick={() => setActiveFilter(cat.key)}
            >
              {meta.icon} {cat.label}
              <span className="ms-1 opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            &#10024;
          </div>
          <div className="empty-state-title">No snapshots yet</div>
          <div className="empty-state-text">
            Your memories will appear here once you add snapshots to your entries.
          </div>
          <Link to="/" className="btn btn-outline-primary btn-sm">
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="snaps-gallery">
          {sorted.map((snap) => (
            <div
              key={snap.key}
              className="snap-card"
              style={{ borderLeftColor: snap.color }}
            >
              <div className="snap-card-quote">
                &ldquo;{snap.text}&rdquo;
              </div>
              <div className="snap-card-source">
                <span className="snap-card-icon" aria-hidden="true">
                  {snap.icon}
                </span>
                <span>{snap.title}</span>
                <span className="snap-card-divider">&middot;</span>
                <span>{snap.label}</span>
                {snap.date && (
                  <>
                    <span className="snap-card-divider">&middot;</span>
                    <span>{formatDate(snap.date)}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default Snaps;
