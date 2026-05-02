import React from "react";
import { Badge } from "react-bootstrap";
import categoryMeta from "helpers/categoryMeta";
import { getStatusLabel } from "helpers/statusLabels";
import dataService, { STORAGE_KEYS } from "services/dataService";

const categories = Object.keys(STORAGE_KEYS).map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

function Timeline() {
  const allEntries = categories
    .flatMap((cat) => {
      const meta = categoryMeta[cat.key] || {};
      return dataService.getItems(cat.key).map((item) => ({
        category: cat.key,
        label: cat.label,
        meta,
        title:
          item[meta.primaryField] ||
          item.artist ||
          item.title ||
          item.type ||
          item.make ||
          "Untitled",
        subtitle: (meta.secondaryFields || [])
          .map((f) => item[f])
          .filter(Boolean)
          .join(", "),
        status: item.status,
        date: item.startDate || item.createdAt || "",
      }));
    })
    .filter((e) => e.date)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Group by month/year
  const grouped = {};
  allEntries.forEach((entry) => {
    const d = new Date(entry.date + "T00:00:00");
    const key = isNaN(d.getTime())
      ? "Unknown"
      : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  const months = Object.keys(grouped);

  return (
    <div>
      <h4 className="mb-4" style={{ fontWeight: 700 }}>Timeline</h4>

      {months.length === 0 ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            &#128197;
          </div>
          <div className="empty-state-title">No entries yet</div>
          <div className="empty-state-text">
            Add items to any category and they will appear here chronologically.
          </div>
        </div>
      ) : (
        <div className="timeline">
          {months.map((month) => (
            <div key={month}>
              <div className="timeline-month">{month}</div>
              {grouped[month].map((entry, i) => (
                <div key={i} className="timeline-entry">
                  <div
                    style={{
                      position: "absolute",
                      left: "-2rem",
                      top: "4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: entry.meta.color,
                      border: "2px solid var(--color-surface)",
                      boxShadow: `0 0 0 2px ${entry.meta.color}40`,
                    }}
                  />
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="timeline-entry-title">
                        {entry.title}
                      </div>
                      <div className="timeline-entry-meta">
                        {formatDate(entry.date)}
                        {entry.subtitle && ` \u2022 ${entry.subtitle}`}
                        {" \u2022 "}
                        {entry.label}
                      </div>
                    </div>
                    {entry.status && (
                      <Badge
                        bg={
                          ["attended", "visited", "owned"].includes(entry.status)
                            ? "success"
                            : entry.status === "wishlist"
                            ? "warning"
                            : "secondary"
                        }
                        className={`badge-status ${
                          entry.status === "wishlist" ? "text-dark" : ""
                        }`}
                      >
                        {getStatusLabel(entry.category, entry.status)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
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

export default Timeline;
