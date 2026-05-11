import React, { useState, useEffect } from "react";
import { Badge } from "react-bootstrap";
import categoryMeta from "../helpers/categoryMeta";
import { getStatusLabel } from "../helpers/statusLabels";
import { getSnapshotTeaser } from "../helpers/operator";
import dataService from "../services/dataService";

const CATEGORY_KEYS = ["events", "travel", "cars", "homes", "activities", "cellar"];

const categories = CATEGORY_KEYS.map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

function Timeline() {
  const [activeYear, setActiveYear] = useState("all");
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const rows = await Promise.all(
        categories.map(async (cat) => {
          const meta = categoryMeta[cat.key] || {};
          const items = await dataService.getItems(cat.key);
          return items.map((item) => {
            // For wishlist items without startDate, derive from target month/year
            let date = item.startDate || item.createdAt || "";
            if (!item.startDate && item.status === "wishlist" && item.targetYear) {
              const monthIndex = item.targetMonth
                ? new Date(`${item.targetMonth} 1, 2000`).getMonth() + 1
                : 1;
              const mm = String(monthIndex).padStart(2, "0");
              date = `${item.targetYear}-${mm}-01`;
            }
            return {
              category: cat.key,
              label: cat.label,
              meta,
              title:
                (meta.getPrimaryDisplay ? meta.getPrimaryDisplay(item) : null) ||
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
              date,
              isWishlist: item.status === "wishlist",
              snapshot: getSnapshotTeaser(item),
            };
          });
        })
      );
      const sorted = rows
        .flat()
        .filter((e) => e.date)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (!cancelled) {
        setAllEntries(sorted);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const years = [
    ...new Set(
      allEntries
        .map((e) => new Date(e.date + "T00:00:00").getFullYear())
        .filter((y) => !isNaN(y))
    ),
  ].sort((a, b) => b - a);

  const filteredEntries =
    activeYear === "all"
      ? allEntries
      : allEntries.filter(
          (e) =>
            String(new Date(e.date + "T00:00:00").getFullYear()) === activeYear
        );

  const grouped = {};
  filteredEntries.forEach((entry) => {
    const d = new Date(entry.date + "T00:00:00");
    const key = isNaN(d.getTime())
      ? "Unknown"
      : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  const months = Object.keys(grouped);

  if (loading) return null;

  return (
    <div>
      <h4 className="mb-3" style={{ fontWeight: 700 }}>My Story</h4>

      {years.length > 0 && (
        <div className="status-toggle mb-4">
          <button
            className={`btn ${activeYear === "all" ? "active" : ""}`}
            onClick={() => setActiveYear("all")}
          >
            All
          </button>
          {years.map((year) => {
            const count = allEntries.filter(
              (e) =>
                String(new Date(e.date + "T00:00:00").getFullYear()) ===
                String(year)
            ).length;
            return (
              <button
                key={year}
                className={`btn ${activeYear === String(year) ? "active" : ""}`}
                onClick={() => setActiveYear(String(year))}
              >
                {year}
                <span className="ms-1 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

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
                      backgroundColor: entry.isWishlist ? "var(--color-surface)" : entry.meta.color,
                      border: entry.isWishlist
                        ? `2px dashed ${entry.meta.color}`
                        : "2px solid var(--color-surface)",
                      boxShadow: entry.isWishlist ? "none" : `0 0 0 2px ${entry.meta.color}40`,
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
                      {entry.snapshot && (
                        <div className="timeline-snapshot">
                          &#10024; &ldquo;{entry.snapshot}&rdquo;
                        </div>
                      )}
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
