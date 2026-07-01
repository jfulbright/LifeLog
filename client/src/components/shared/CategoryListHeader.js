import React from "react";
import { Button } from "react-bootstrap";
import StatsStrip from "./StatsStrip";
import MultiPillFilter from "./MultiPillFilter";
import SourceFilterPills from "./SourceFilterPills";
import { getStatusLabel } from "../../helpers/filterUtils";
import { useViewerMode } from "../../contexts/ViewerModeContext";

/**
 * Shared header for all category list pages. The data filters — Status
 * (Wishlist/Visited), Year, and the category-specific dimensions — render as one
 * row of dropdown pills (each shows its active value, or the dimension name when
 * unset). Source (Mine/Shared) and the View toggle stay as their own controls.
 *
 * Order: Title · Stats · [extra content] · [Status · Year · …filterPills] · Tabs · Source
 */
export default function CategoryListHeader({
  title,
  addLabel = "+ Add",
  onAdd,
  extraActions,

  // StatsStrip
  stats,
  statsLink,

  // Status pill (built from the category's status options)
  category,
  statusOptions,
  filterStatus,
  onStatusChange,

  // Year pill
  yearOptions,
  activeYear,
  onYearChange,

  // Category-specific dropdown pills (MultiPillFilter descriptors)
  filterPills,
  filterColor,

  // Non-filter content rendered above the filter row (e.g. KidsStats, social feed)
  renderExtraFilters,

  // Tabs (view toggle, e.g. List/Map, Snaps/Photos)
  tabs,
  activeTab,
  onTabChange,
  tabColor,

  // SourceFilterPills
  sourceFilter,
  onSourceChange,
  avatarUrl,
  sharedCount,
  recommendedCount,
}) {
  const isViewer = !!useViewerMode();

  // Assemble the unified filter row: Status, Year, then category dimensions.
  const unifiedPills = [];

  if (statusOptions && statusOptions.length > 1 && filterStatus !== undefined && onStatusChange) {
    unifiedPills.push({
      key: "__status",
      label: "Status",
      allLabel: "Any status",
      value: filterStatus,
      onChange: onStatusChange,
      options: statusOptions
        .filter((s) => s !== "all")
        .map((s) => ({ value: s, label: getStatusLabel(category, s) })),
    });
  }

  if (yearOptions && yearOptions.length >= 1 && onYearChange) {
    unifiedPills.push({
      key: "__year",
      label: "Year",
      allLabel: "Any year",
      value: activeYear,
      onChange: onYearChange,
      options: yearOptions.map((y) => ({ value: String(y), label: String(y) })),
    });
  }

  if (filterPills && filterPills.length > 0) {
    unifiedPills.push(...filterPills);
  }

  return (
    <>
      {/* Title row */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>
          {title}
        </h4>
        <div className="d-flex align-items-center gap-2">
          {!isViewer && extraActions}
          {onAdd && !isViewer && (
            <Button variant="primary" size="sm" onClick={onAdd}>
              {addLabel}
            </Button>
          )}
        </div>
      </div>

      {/* StatsStrip */}
      {stats && stats.length > 0 && (
        <StatsStrip stats={stats} icon="📊" statsLink={statsLink} />
      )}

      {/* Non-filter content (KidsStats, MovieSocialFeed, …) above the filter row */}
      {renderExtraFilters && renderExtraFilters()}

      {/* Unified filter row: Status · Year · category dimensions */}
      {unifiedPills.length > 0 && (
        <MultiPillFilter pills={unifiedPills} color={filterColor || "var(--color-primary)"} />
      )}

      {/* Tabs (pill-style view toggle, e.g. List/Map, Snaps/Photos) */}
      {tabs && tabs.length > 0 && (
        <div className="d-flex gap-2 mb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: "0.3rem 0.9rem",
                borderRadius: "20px",
                border: `2px solid ${tabColor || filterColor || "var(--color-primary)"}`,
                background: activeTab === tab.id ? (tabColor || filterColor || "var(--color-primary)") : "transparent",
                color: activeTab === tab.id ? "#fff" : (tabColor || filterColor || "var(--color-primary)"),
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* SourceFilterPills (hidden in viewer mode — all items are the profile owner's) */}
      {sourceFilter !== undefined && onSourceChange && !isViewer && (
        <SourceFilterPills
          value={sourceFilter}
          onChange={onSourceChange}
          avatarUrl={avatarUrl}
          sharedCount={sharedCount}
          recommendedCount={recommendedCount}
        />
      )}
    </>
  );
}
