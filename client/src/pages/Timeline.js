import React, { useState, useEffect } from "react";
import { Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import categoryMeta from "../helpers/categoryMeta";
import { getStatusLabel } from "../helpers/statusLabels";
import { getSnapshotTeaser } from "../helpers/operator";
import dataService from "../services/dataService";
import PrivacyIndicator, { isEntryShared } from "../components/shared/PrivacyIndicator";
import SourceFilterPills from "../components/shared/SourceFilterPills";
import EntryDetailPanel from "../components/shared/EntryDetailPanel";
import StatsStrip from "../components/shared/StatsStrip";
import { useAppData } from "../contexts/AppDataContext";
import eventSchema from "../features/events/eventSchema";
import travelSchema from "../features/travel/travelSchema";
import carSchema from "../features/cars/carSchema";
import homeSchema from "../features/homes/homeSchema";
import activitySchema from "../features/activities/activitySchema";
import cellarSchema from "../features/cellar/cellarSchema";
import kidsSchema from "../features/kids/kidsSchema";

const SCHEMA_MAP = {
  events: eventSchema,
  travel: travelSchema,
  cars: carSchema,
  homes: homeSchema,
  activities: activitySchema,
  cellar: cellarSchema,
  kids: kidsSchema,
};

const CATEGORY_KEYS = ["events", "travel", "cars", "homes", "activities", "cellar", "kids"];

const categories = CATEGORY_KEYS.map((key) => ({
  key,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function Timeline() {
  const [activeYear, setActiveYear] = useState("all");
  const [activeMonth, setActiveMonth] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailEntry, setDetailEntry] = useState(null);
  const { profile } = useAppData();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const rows = await Promise.all(
        categories.map(async (cat) => {
          const meta = categoryMeta[cat.key] || {};
          const items = await dataService.getItemsWithShared(cat.key);
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
      {(() => {
        if (allEntries.length === 0) return null;
        const totalEntries = allEntries.length;
        const categoriesUsed = [...new Set(allEntries.map((e) => e.category))].length;
        const countries = [...new Set(allEntries.filter((e) => e.country && e.country !== "US").map((e) => e.country))].length;
        const stats = [
          { value: totalEntries, label: "entries", color: "var(--color-primary)" },
          { value: categoriesUsed, label: "categories" },
        ];
        if (countries > 0) stats.push({ value: countries, label: "countries", color: "var(--color-travel)" });
        return <StatsStrip stats={stats} />;
      })()}

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
      {activeYear !== "all" && monthsWithData.length > 0 && (
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
      <SourceFilterPills
        value={sourceFilter}
        onChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={allEntries.filter((e) => e.isShared).length}
      />

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
                <div key={i} className="timeline-entry"
                  onClick={() => {
                    if (entry.rawItem) setDetailEntry(entry);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "-2.4rem",
                      top: "0px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.65rem",
                      backgroundColor: entry.isWishlist ? "var(--color-surface)" : entry.meta.color + "20",
                      border: entry.isWishlist
                        ? `2px dashed ${entry.meta.color}`
                        : `2px solid ${entry.meta.color}`,
                    }}
                  >
                    {entry.meta.icon}
                  </div>
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

      {detailEntry && (
        <EntryDetailPanel
          item={detailEntry.rawItem}
          category={detailEntry.category}
          schema={SCHEMA_MAP[detailEntry.category] || []}
          onClose={() => setDetailEntry(null)}
          onSave={(updatedData) => {
            dataService.saveItems(detailEntry.category, [updatedData]);
            setDetailEntry(null);
          }}
          onDelete={(id) => {
            setDetailEntry(null);
          }}
        />
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
