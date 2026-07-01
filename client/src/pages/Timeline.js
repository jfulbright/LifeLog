import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import categoryMeta from "../helpers/categoryMeta";
import { formatDisplayDate } from "../helpers/dateUtils";
import StatusBadge from "../components/shared/StatusBadge";
import { getSnapshotTeaser, isSharedSource } from "../helpers/operator";
import dataService from "../services/dataService";
import PrivacyIndicator from "../components/shared/PrivacyIndicator";
import SourceFilterPills from "../components/shared/SourceFilterPills";
import EntryDetailPanel from "../components/shared/EntryDetailPanel";
import StatsStrip from "../components/shared/StatsStrip";
import MultiPillFilter from "../components/shared/MultiPillFilter";
import { matchesDoneWishlist } from "../components/shared/DoneWishlistFilter";
import { useAppData } from "../contexts/AppDataContext";
import { SCHEMA_MAP, CATEGORY_KEYS } from "../helpers/schemaRegistry";
import { enrichItemsWithSocialContent, getSocialPreview, getAllSocialPhotos } from "../helpers/socialContent";
import { RING_META } from "../helpers/ringMeta";
import IncomingSummary from "../components/shared/IncomingSummary";

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
  const [activeStatus, setActiveStatus] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePeople, setActivePeople] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailEntry, setDetailEntry] = useState(null);
  const { profile, contacts } = useAppData();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const rows = await Promise.all(
        categories.map(async (cat) => {
          const meta = categoryMeta[cat.key] || {};
          const rawItems = await dataService.getItemsWithShared(cat.key);
          const items = await enrichItemsWithSocialContent(rawItems, contacts);
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
              isShared: isSharedSource(item),
              ownerId: item._ownerId || null,
              rawItem: item,
              snapshot: getSnapshotTeaser(item),
              socialPreview: getSocialPreview(item),
              thumbs: (() => {
                const social = (getAllSocialPhotos(item) || []).map((p) => p.url).filter(Boolean);
                const base = social.length > 0 ? social : [item.photo1, item.photo2, item.photo3];
                return base.filter(Boolean).slice(0, 3);
              })(),
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
  }, [contacts]);

  const years = [
    ...new Set(
      allEntries
        .map((e) => new Date(e.date + "T00:00:00").getFullYear())
        .filter((y) => !isNaN(y))
    ),
  ].sort((a, b) => b - a);

  const timelineCategories = [...new Set(allEntries.map((e) => e.category).filter(Boolean))];

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

  // Apply Done/Wishlist status filter
  if (activeStatus !== "all") {
    filteredEntries = filteredEntries.filter((e) => matchesDoneWishlist(e.status, activeStatus));
  }

  // Apply category filter
  if (activeCategory !== "all") {
    filteredEntries = filteredEntries.filter((e) => e.category === activeCategory);
  }

  // Apply People filter (a specific ring, or a specific individual). Owners are
  // resolved to a contact via linked_user_id → ring level (same as SharedFeed).
  const contactByUserId = {};
  (contacts || []).forEach((c) => { if (c.linkedUserId) contactByUserId[c.linkedUserId] = c; });
  if (activePeople.startsWith("ring:")) {
    const ring = Number(activePeople.slice(5));
    filteredEntries = filteredEntries.filter((e) => contactByUserId[e.ownerId]?.ringLevel === ring);
  } else if (activePeople.startsWith("person:")) {
    const uid = activePeople.slice(7);
    filteredEntries = filteredEntries.filter((e) => e.ownerId === uid);
  }

  // Apply source filter (All / Mine / Shared / Recommended)
  if (sourceFilter === "mine") {
    filteredEntries = filteredEntries.filter((e) => !e.isShared);
  } else if (sourceFilter === "shared") {
    filteredEntries = filteredEntries.filter((e) => e.isShared);
  } else if (sourceFilter === "recommended") {
    filteredEntries = filteredEntries.filter((e) => e.rawItem?._isRecommended);
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

  // People filter options: rings + individuals present among shared entries.
  const sharedOwnerIds = [...new Set(allEntries.map((e) => e.ownerId).filter((id) => id && contactByUserId[id]))];
  const ringsPresent = [...new Set(sharedOwnerIds.map((id) => contactByUserId[id].ringLevel))]
    .filter((r) => r != null)
    .sort((a, b) => a - b);
  const peopleOptions = [
    ...ringsPresent.map((r) => ({ value: `ring:${r}`, label: `${RING_META[r]?.emoji || ""} ${RING_META[r]?.label || `Ring ${r}`}` })),
    ...sharedOwnerIds.map((id) => ({ value: `person:${id}`, label: contactByUserId[id].displayName || "Someone" })),
  ];

  // One dropdown-pill row: Status · Year · Month (when a year is picked) · Category.
  const timelinePills = [
    {
      key: "__status", label: "Status", allLabel: "Any status",
      value: activeStatus, onChange: setActiveStatus,
      options: [{ value: "done", label: "Done" }, { value: "wishlist", label: "Wishlist" }],
    },
    ...(years.length > 0 ? [{
      key: "__year", label: "Year", allLabel: "Any year",
      value: activeYear, onChange: (y) => { setActiveYear(y); setActiveMonth("all"); },
      options: years.map((y) => ({ value: String(y), label: String(y) })),
    }] : []),
    ...(monthsWithData.length > 0 ? [{
      key: "__month", label: "Month", allLabel: "All months",
      value: activeMonth, onChange: setActiveMonth,
      options: monthsWithData.map((m) => ({ value: String(m), label: MONTH_NAMES[m] })),
      visibleWhen: (v) => v.__year && v.__year !== "all",
    }] : []),
    ...(timelineCategories.length > 1 ? [{
      key: "__category", label: "Category", allLabel: "All categories",
      value: activeCategory, onChange: setActiveCategory,
      options: timelineCategories.map((cat) => ({
        value: cat,
        label: `${(categoryMeta[cat] || {}).icon || ""} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`,
      })),
    }] : []),
    ...(peopleOptions.length > 0 ? [{
      key: "__people", label: "People", allLabel: "Everyone",
      value: activePeople, onChange: setActivePeople,
      options: peopleOptions,
    }] : []),
  ];

  if (loading) return null;

  return (
    <div>
      <IncomingSummary />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Timeline</h4>
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

      {/* Unified filter row: Status · Year · Month · Category */}
      <MultiPillFilter pills={timelinePills} color="var(--color-primary)" />

      {/* Source filter (All / Mine / Shared / Recommended) */}
      <SourceFilterPills
        value={sourceFilter}
        onChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={allEntries.filter((e) => e.isShared).length}
        recommendedCount={allEntries.filter((e) => e.rawItem?._isRecommended).length}
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
                        {formatDisplayDate(entry.date)}
                        {entry.subtitle && ` \u2022 ${entry.subtitle}`}
                        {" \u2022 "}
                        {entry.label}
                      </div>
                      {entry.snapshot && (
                        <div className="timeline-snapshot">
                          &#10024; &ldquo;{entry.snapshot}&rdquo;
                        </div>
                      )}
                      {entry.socialPreview && (
                        <div className="timeline-snapshot">
                          🤝 &ldquo;{entry.socialPreview}&rdquo;
                        </div>
                      )}
                      {entry.thumbs.length > 0 && (
                        <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.5rem" }}>
                          {entry.thumbs.map((url, ti) => (
                            <img
                              key={ti}
                              src={url}
                              alt=""
                              loading="lazy"
                              style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid var(--color-border)" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <StatusBadge category={entry.category} status={entry.status} />
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

export default Timeline;
