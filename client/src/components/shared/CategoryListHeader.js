import React from "react";
import { Button } from "react-bootstrap";
import StatsStrip from "./StatsStrip";
import StatusToggle from "./StatusToggle";
import GroupedDropdownFilter from "./GroupedDropdownFilter";
import SourceFilterPills from "./SourceFilterPills";

/**
 * Shared header component for all category list pages.
 * Renders the standard stack: Title row, StatsStrip, StatusToggle, Tabs, Filters, SourceFilterPills.
 * Each section is optional and driven by props.
 */
export default function CategoryListHeader({
  title,
  addLabel = "+ Add",
  onAdd,
  extraActions,

  // StatsStrip
  stats,

  // StatusToggle
  category,
  statusOptions,
  filterStatus,
  onStatusChange,

  // Tabs (optional)
  tabs,
  activeTab,
  onTabChange,
  tabColor,

  // Custom filter slot (rendered between tabs and GroupedDropdownFilter)
  renderExtraFilters,

  // GroupedDropdownFilter
  filterGroups,
  filterValue,
  onFilterChange,
  filterColor,

  // SourceFilterPills (optional)
  sourceFilter,
  onSourceChange,
  avatarUrl,
  sharedCount,
  recommendedCount,
}) {
  return (
    <>
      {/* Title row */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>
          {title}
        </h4>
        <div className="d-flex align-items-center gap-2">
          {extraActions}
          <Button variant="primary" size="sm" onClick={onAdd}>
            {addLabel}
          </Button>
        </div>
      </div>

      {/* StatsStrip */}
      {stats && stats.length > 0 && (
        <StatsStrip stats={stats} icon="📊" />
      )}

      {/* StatusToggle */}
      {statusOptions && (
        <StatusToggle
          category={category}
          options={statusOptions}
          value={filterStatus}
          onChange={onStatusChange}
        />
      )}

      {/* Tabs (pill-style) */}
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

      {/* Custom extra filters (e.g. Kids ChildFilter, MilestoneTypeFilter) */}
      {renderExtraFilters && renderExtraFilters()}

      {/* GroupedDropdownFilter */}
      {filterGroups && filterGroups.length > 0 && (
        <GroupedDropdownFilter
          groups={filterGroups}
          value={filterValue}
          onChange={onFilterChange}
          color={filterColor || "var(--color-primary)"}
        />
      )}

      {/* SourceFilterPills */}
      {sourceFilter !== undefined && onSourceChange && (
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
