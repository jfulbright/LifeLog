import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import KidsForm from "./KidsForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import MultiPillFilter from "../../../components/shared/MultiPillFilter";
import { RATING_PILL_OPTIONS, matchesRatingValue } from "../../../components/shared/GroupedDropdownFilter";
import kidsSchema, { KIDS_EVENT_TYPES } from "../kidsSchema";
import useCategory from "../../../hooks/useCategory";
import useListFilters from "../../../hooks/useListFilters";
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
  const [ratingFilter, setRatingFilter] = React.useState("all");

  const {
    items: milestones,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm, saveDetailEdit,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("kids", { schema: kidsSchema });

  const lf = useListFilters(milestones, { dateField: ["startDate", "createdAt"] });
  const kidsStatuses = getStatusFilterOptions("kids");
  const statusFiltered = filterByStatus(milestones, filterStatus);
  const commonFiltered = lf.applyCommonFilters(statusFiltered);

  const filtered = useMemo(() => {
    let items = commonFiltered
      .filter((i) => milestoneTypeFilter === "all" || i.milestoneType === milestoneTypeFilter)
      .filter((i) => childFilter === "all" || i.childContactId === childFilter);
    if (ratingFilter !== "all") {
      items = items.filter((i) => matchesRatingValue(i.rating, ratingFilter));
    }
    return items;
  }, [commonFiltered, milestoneTypeFilter, childFilter, ratingFilter]);

  // One combinable pill row: Child (when 2+ kids) + Milestone Type + Rating.
  const kidsPills = useMemo(() => {
    const children = contacts.filter((c) => c.isChild);
    const pills = [];
    if (children.length > 1) {
      pills.push({
        key: "child",
        label: "\u{1F9D2} Child",
        allLabel: "All Kids",
        value: childFilter,
        onChange: setChildFilter,
        color: "var(--color-text-secondary)",
        options: children.map((c) => ({ value: c.id, label: c.displayName })),
      });
    }
    pills.push({
      key: "milestoneType",
      label: "\u{1F31F} Type",
      value: milestoneTypeFilter,
      onChange: setMilestoneTypeFilter,
      options: KIDS_EVENT_TYPES.map((t) => ({ value: t.value, label: t.label })),
    });
    pills.push({
      key: "rating",
      label: "★ Rating",
      value: ratingFilter,
      onChange: setRatingFilter,
      options: RATING_PILL_OPTIONS,
    });
    return pills;
  }, [contacts, childFilter, milestoneTypeFilter, ratingFilter]);

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
        category="kids"
        statusOptions={kidsStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        yearOptions={lf.yearOptions}
        activeYear={lf.activeYear}
        onYearChange={lf.setActiveYear}
        renderExtraFilters={() => (
          <>
            <KidsStats items={milestones} contacts={contacts} />
            <MultiPillFilter pills={kidsPills} color="var(--color-kids, #FF6B35)" />
          </>
        )}
        sourceFilter={lf.sourceFilter}
        onSourceChange={lf.setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={lf.sharedCount}
        recommendedCount={lf.recommendedCount}
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
          onSave={(data) => { saveDetailEdit(data); setViewDetailItem(null); }}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
        />
      )}
    </>
  );
}

export default KidsList;
