import React, { useState, useEffect } from "react";
import { Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import categoryMeta from "../helpers/categoryMeta";
import { getStatusLabel } from "../helpers/statusLabels";
import { getSnapshotTeaser } from "../helpers/operator";
import dataService from "../services/dataService";
import PrivacyIndicator, { isEntryShared } from "../components/shared/PrivacyIndicator";

const CATEGORY_KEYS = ["events", "travel", "cars", "homes", "activities", "cellar", "kids"];

const categories = CATEGORY_KEYS.map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function MiniStats({ entries }) {
  if (entries.length === 0) return null;

  const totalEntries = entries.length;
  const categoriesUsed = [...new Set(entries.map((e) => e.category))].length;
  const countries = [...new Set(
    entries.filter((e) => e.country && e.country !== "US").map((e) => e.country)
  )].length;
  const wishlistCount = entries.filter((e) => e.isWishlist).length;

  return (
    <div style={{
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      alignItems: "center",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius, 8px)",
      padding: "0.55rem 1rem",
      marginBottom: "0.75rem",
      fontSize: "var(--font-size-sm)",
    }}>
      <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>{totalEntries}</span>
      <span style={{ color: "var(--color-text-secondary)" }}>entries</span>
      <span style={{ color: "var(--color-text-tertiary)" }}>&middot;</span>
      <span style={{ fontWeight: 800, color: "var(--color-events, #611F69)" }}>{categoriesUsed}</span>
      <span style={{ color: "var(--color-text-secondary)" }}>categories</span>
      {countries > 0 && (
        <>
          <span style={{ color: "var(--color-text-tertiary)" }}>&middot;</span>
          <span style={{ fontWeight: 800, color: "var(--color-travel)" }}>{countries}</span>
          <span style={{ color: "var(--color-text-secondary)" }}>countries</span>
        </>
      )}
      {wishlistCount > 0 && (
        <>
          <span style={{ color: "var(--color-text-tertiary)" }}>&middot;</span>
          <span style={{ fontWeight: 800, color: "var(--color-warning)" }}>{wishlistCount}</span>
          <span style={{ color: "var(--color-text-secondary)" }}>planned</span>
        </>
      )}
      <Link
        to="/travel/stats"
        style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-travel)", textDecoration: "none" }}
      >
        Full Stats &rarr;
      </Link>
    </div>
  );
}

function Timeline() {
  const [activeYear, setActiveYear] = useState("all");
  const [activeMonth, setActiveMonth] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
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
              country: item.country,
              date,
              isWishlist: item.status === "wishlist",
              isShared: isEntryShared(item),
              rawItem: item,
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
    return () => { cancelled = true; };
  }, []);

  const years = [
    ...new Set(
      allEntries
        .map((e) => new Date(e.date + "T00:00:00").getFullYear())
        .filter((y) => !isNaN(y))
    ),
  ].sort((a, b) => b - a);

  // Apply year filter
  let filteredEntries = activeYear === "all"
    ? allEntries
    : allEntries.filter(
        (e) => String(new Date(e.date + "T00:00:00").getFullYear()) === activeYear
      );

  // Apply month filter
  if (activeMonth !== "all" && activeYear !== "all") {
    filteredEntries = filteredEntries.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return d.getMonth() === parseInt(activeMonth);
    });
  }

  // Apply source filter (All / Mine / Shared)
  if (sourceFilter === "mine") {
    filteredEntries = filteredEntries.filter((e) => !e.isShared);
  } else if (sourceFilter === "shared") {
    filteredEntries = filteredEntries.filter((e) => e.isShared);
  }

  // Get months that have entries for the selected year (for month pills)
  const monthsWithData = activeYear !== "all"
    ? [...new Set(
        allEntries
          .filter((e) => String(new Date(e.date + "T00:00:00").getFullYear()) === activeYear)
          .map((e) => new Date(e.date + "T00:00:00").getMonth())
      )].sort((a, b) => a - b)
    : [];

  const grouped = {};
  filteredEntries.forEach((entry) => {
    const d = new Date(entry.date + "T00:00:00");
    const key = isNaN(d.getTime())
      ? "Unknown"
      : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });

  const groupedMonths = Object.keys(grouped);

  if (loading) return null;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>My Timeline</h4>
        <Link to="/travel/stats" className="btn btn-sm btn-outline-secondary">
          🗺️ Map & Stats
        </Link>
      </div>

      {/* Teaser stats */}
      <MiniStats entries={allEntries} />

      {/* Year pills */}
      {years.length > 0 && (
        <div className="status-toggle mb-2">
          <button
            className={`btn ${activeYear === "all" ? "active" : ""}`}
            onClick={() => { setActiveYear("all"); setActiveMonth("all"); }}
          >
            All
          </button>
          {years.map((year) => {
            const count = allEntries.filter(
              (e) => String(new Date(e.date + "T00:00:00").getFullYear()) === String(year)
            ).length;
            return (
              <button
                key={year}
                className={`btn ${activeYear === String(year) ? "active" : ""}`}
                onClick={() => { setActiveYear(String(year)); setActiveMonth("all"); }}
              >
                {year}
                <span className="ms-1 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Month sub-pills (only when a year is selected) */}
      {activeYear !== "all" && monthsWithData.length > 1 && (
        <div className="status-toggle mb-2" style={{ fontSize: "var(--font-size-xs)" }}>
          <button
            className={`btn ${activeMonth === "all" ? "active" : ""}`}
            onClick={() => setActiveMonth("all")}
          >
            All Months
          </button>
          {monthsWithData.map((m) => (
            <button
              key={m}
              className={`btn ${activeMonth === String(m) ? "active" : ""}`}
              onClick={() => setActiveMonth(String(m))}
            >
              {MONTH_NAMES[m]}
            </button>
          ))}
        </div>
      )}

      {/* Source filter (All / Mine / Shared) */}
      <div className="d-flex gap-2 mb-3" style={{ fontSize: "var(--font-size-xs)" }}>
        {[
          { id: "all", label: "All" },
          { id: "mine", label: "\uD83D\uDD12 Mine" },
          { id: "shared", label: "\uD83D\uDC65 Shared" },
        ].map((opt) => (
          <button
            key={opt.id}
            className="btn btn-sm"
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: 12,
              fontSize: "var(--font-size-xs)",
              fontWeight: sourceFilter === opt.id ? 700 : 500,
              background: sourceFilter === opt.id ? "var(--color-primary)" : "var(--color-surface)",
              color: sourceFilter === opt.id ? "#fff" : "var(--color-text-secondary)",
              border: `1px solid ${sourceFilter === opt.id ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
            onClick={() => setSourceFilter(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {groupedMonths.length === 0 ? (
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
          {groupedMonths.map((month) => (
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
                        <PrivacyIndicator item={entry.rawItem || entry} style={{ marginLeft: "0.4rem" }} />
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
                          ["attended", "visited", "owned", "done", "tried"].includes(entry.status)
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
