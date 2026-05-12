import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import KidsForm from "./KidsForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_GROUP } from "../../../components/shared/GroupedDropdownFilter";
import kidsSchema, { KIDS_EVENT_TYPES } from "../kidsSchema";
import useCategory from "../../../hooks/useCategory";
import { useAppData } from "../../../contexts/AppDataContext";
import {
  getStatusFilterOptions,
  filterByStatus,
} from "../../../helpers/filterUtils";

function getAgeAtDate(birthday, eventDate) {
  if (!birthday || !eventDate) return null;
  const birth = new Date(birthday);
  const event = new Date(eventDate);
  if (isNaN(birth.getTime()) || isNaN(event.getTime())) return null;
  let age = event.getFullYear() - birth.getFullYear();
  const monthDiff = event.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && event.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

function MilestoneTypeFilter({ value, onChange }) {
  return (
    <div className="d-flex gap-2 flex-wrap mb-3">
      <button
        type="button"
        onClick={() => onChange("all")}
        style={{
          padding: "0.3rem 0.75rem",
          borderRadius: "20px",
          border: "2px solid var(--color-kids, #FF6B35)",
          background: value === "all" ? "var(--color-kids, #FF6B35)" : "transparent",
          color: value === "all" ? "#fff" : "var(--color-kids, #FF6B35)",
          fontWeight: 600,
          fontSize: "var(--font-size-sm)",
          cursor: "pointer",
        }}
      >
        All
      </button>
      {KIDS_EVENT_TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          style={{
            padding: "0.3rem 0.75rem",
            borderRadius: "20px",
            border: "2px solid var(--color-kids, #FF6B35)",
            background: value === t.value ? "var(--color-kids, #FF6B35)" : "transparent",
            color: value === t.value ? "#fff" : "var(--color-kids, #FF6B35)",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ChildFilter({ contacts, value, onChange }) {
  const children = contacts.filter((c) => c.isChild);
  if (children.length <= 1) return null;

  return (
    <div className="d-flex gap-2 flex-wrap mb-3">
      <button
        type="button"
        onClick={() => onChange("all")}
        style={{
          padding: "0.3rem 0.75rem",
          borderRadius: "20px",
          border: "2px solid var(--color-text-tertiary)",
          background: value === "all" ? "var(--color-text-secondary)" : "transparent",
          color: value === "all" ? "#fff" : "var(--color-text-secondary)",
          fontWeight: 600,
          fontSize: "var(--font-size-sm)",
          cursor: "pointer",
        }}
      >
        All Kids
      </button>
      {children.map((child) => (
        <button
          key={child.id}
          type="button"
          onClick={() => onChange(child.id)}
          style={{
            padding: "0.3rem 0.75rem",
            borderRadius: "20px",
            border: "2px solid var(--color-kids, #FF6B35)",
            background: value === child.id ? "var(--color-kids, #FF6B35)" : "transparent",
            color: value === child.id ? "#fff" : "var(--color-kids, #FF6B35)",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
          }}
        >
          {child.displayName}
        </button>
      ))}
    </div>
  );
}

function KidsStats({ items, contacts }) {
  const stats = useMemo(() => {
    const logged = items.filter((i) => i.status === "happened");
    const byType = {};
    logged.forEach((i) => {
      const t = i.milestoneType || "other";
      const label = KIDS_EVENT_TYPES.find((et) => et.value === t)?.label || "Other";
      byType[label] = (byType[label] || 0) + 1;
    });
    const childNames = [...new Set(
      logged
        .map((i) => contacts.find((c) => c.id === i.childContactId)?.displayName)
        .filter(Boolean)
    )];
    return { total: logged.length, byType, childNames };
  }, [items, contacts]);

  if (stats.total === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #FFF3ED 0%, #FDF8EC 100%)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      padding: "0.75rem 1rem",
      marginBottom: "1rem",
      display: "flex",
      gap: "1.5rem",
      flexWrap: "wrap",
      alignItems: "center",
    }}>
      <div style={{ fontWeight: 700, color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Milestones
      </div>
      <div>
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#FF6B35" }}>{stats.total}</span>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>logged</span>
      </div>
      {Object.entries(stats.byType).slice(0, 4).map(([type, count]) => (
        <div key={type}>
          <span style={{ fontWeight: 700, color: "#FF6B35" }}>{count}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>{type}</span>
        </div>
      ))}
    </div>
  );
}

function KidsList() {
  const { contacts, profile } = useAppData();
  const [milestoneTypeFilter, setMilestoneTypeFilter] = React.useState("all");
  const [childFilter, setChildFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [ratingFilter, setRatingFilter] = React.useState("all");

  const {
    items: milestones,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("kids", { schema: kidsSchema });

  const kidsStatuses = getStatusFilterOptions("kids");
  const statusFiltered = filterByStatus(milestones, filterStatus);

  const sourceFiltered = sourceFilter === "mine"
    ? statusFiltered.filter((i) => !i._isShared)
    : sourceFilter === "shared"
    ? statusFiltered.filter((i) => i._isShared)
    : sourceFilter === "recommended"
    ? statusFiltered.filter((i) => i._isRecommended)
    : statusFiltered;

  const filtered = useMemo(() => {
    let items = sourceFiltered
      .filter((i) => milestoneTypeFilter === "all" || i.milestoneType === milestoneTypeFilter)
      .filter((i) => childFilter === "all" || i.childContactId === childFilter);
    if (ratingFilter !== "all" && ratingFilter.startsWith("rating:")) {
      const rVal = ratingFilter.split(":")[1];
      items = items.filter((i) => {
        const r = parseInt(i.rating, 10);
        if (rVal === "unrated") return !r;
        if (rVal === "5") return r === 5;
        if (rVal === "4+") return r >= 4;
        if (rVal === "3+") return r >= 3;
        return true;
      });
    }
    return items;
  }, [sourceFiltered, milestoneTypeFilter, childFilter, ratingFilter]);

  const sharedCount = milestones.filter((i) => i._isShared).length;
  const recommendedCount = milestones.filter((i) => i._isRecommended).length;

  const groupedByYear = useMemo(() => {
    const groups = {};
    filtered.forEach((item) => {
      const date = item.startDate || item.createdAt;
      const year = date ? new Date(date).getFullYear() : "Unknown";
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => (b === "Unknown" ? -1 : Number(b) - Number(a)));
  }, [filtered]);

  const renderExtra = (item) => {
    const child = contacts.find((c) => c.id === item.childContactId);
    const age = child ? getAgeAtDate(child.birthday, item.startDate) : null;
    const typeLabel = KIDS_EVENT_TYPES.find((t) => t.value === item.milestoneType)?.label;
    return (
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginTop: "0.2rem" }}>
        {child && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-kids, #FF6B35)", fontWeight: 600 }}>
            {child.displayName}
            {age !== null && ` (age ${age})`}
          </span>
        )}
        {typeLabel && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
            {typeLabel}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <CategoryListHeader
        title={"\u{1F31F} Kids"}
        addLabel="+ Log Milestone"
        onAdd={openForm}
        stats={milestones.length > 0 ? [
          { value: milestones.length, label: "milestones", color: "var(--color-kids, #E91E63)" },
        ] : null}
        category="kids"
        statusOptions={kidsStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        renderExtraFilters={() => (
          <>
            <KidsStats items={milestones} contacts={contacts} />
            <ChildFilter contacts={contacts} value={childFilter} onChange={setChildFilter} />
            <MilestoneTypeFilter value={milestoneTypeFilter} onChange={setMilestoneTypeFilter} />
          </>
        )}
        filterGroups={[RATING_GROUP]}
        filterValue={ratingFilter}
        onFilterChange={setRatingFilter}
        filterColor="var(--color-kids, #FF6B35)"
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={sharedCount}
        recommendedCount={recommendedCount}
      />

      {filtered.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "#FF6B35", color: "#fff" }}>
            🌟
          </div>
          <div className="empty-state-title">
            {milestones.length === 0 ? "No milestones yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {milestones.length === 0
              ? "Start logging your kids' milestones — first days, graduations, sports wins, and more."
              : "No milestones match these filters."}
          </div>
          {milestones.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Log First Milestone
            </Button>
          )}
        </div>
      )}

      {groupedByYear.map(([year, items]) => (
        <div key={year} style={{ marginBottom: "1.5rem" }}>
          <div style={{
            fontWeight: 800,
            fontSize: "var(--font-size-sm)",
            color: "var(--color-kids, #FF6B35)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            paddingBottom: "0.375rem",
            borderBottom: "2px solid var(--color-kids, #FF6B35)",
            marginBottom: "0.75rem",
          }}>
            {year}
          </div>
          <ItemCardList
            category="kids"
            items={items}
            schema={kidsSchema}
            onEdit={startEditing}
            onDelete={deleteItem}
            onViewDetail={setViewDetailItem}
            renderCompactExtra={renderExtra}
          />
        </div>
      ))}

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Milestone" : "Log Milestone"}
      >
        <KidsForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Milestone logged 🌟"
      />

      <SnapCaptureModal
        show={showSnapPrompt}
        onClose={dismissSnapPrompt}
        onSave={handleSnapSave}
        itemTitle={snapPromptTitle}
      />

      {viewDetailItem && (
        <EntryDetailPanel
          item={viewDetailItem}
          category="kids"
          schema={kidsSchema}
          onClose={() => setViewDetailItem(null)}
          onSave={() => setViewDetailItem(null)}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
        />
      )}
    </>
  );
}

export default KidsList;
