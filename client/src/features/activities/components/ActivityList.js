import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import ActivityForm from "./ActivityForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import StatusToggle from "../../../components/shared/StatusToggle";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import activitySchema, { ACTIVITY_TYPES } from "../activitySchema";
import useCategory from "../../../hooks/useCategory";
import {
  getStatusFilterOptions,
  filterByStatus,
} from "../../../helpers/filterUtils";

function ActivityTypeFilter({ value, onChange }) {
  const groupLabels = Object.values(ACTIVITY_TYPES).map((g) => ({
    label: g.label,
    options: g.options,
  }));

  return (
    <div className="d-flex gap-2 flex-wrap mb-3">
      <button
        type="button"
        onClick={() => onChange("all")}
        style={{
          padding: "0.3rem 0.75rem",
          borderRadius: "20px",
          border: "2px solid var(--color-activities, #2EB67D)",
          background: value === "all" ? "var(--color-activities, #2EB67D)" : "transparent",
          color: value === "all" ? "#fff" : "var(--color-activities, #2EB67D)",
          fontWeight: 600,
          fontSize: "var(--font-size-sm)",
          cursor: "pointer",
        }}
      >
        All
      </button>
      {groupLabels.map((group) => (
        <details key={group.label} style={{ display: "inline-block" }}>
          <summary style={{
            padding: "0.3rem 0.75rem",
            borderRadius: "20px",
            border: "2px solid var(--color-activities, #2EB67D)",
            background: group.options.includes(value) ? "var(--color-activities, #2EB67D)" : "transparent",
            color: group.options.includes(value) ? "#fff" : "var(--color-activities, #2EB67D)",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
            listStyle: "none",
          }}>
            {group.label}
          </summary>
          <div style={{
            position: "absolute",
            zIndex: 100,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--card-radius)",
            padding: "0.5rem",
            boxShadow: "var(--card-shadow-hover)",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
            minWidth: 160,
          }}>
            {group.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); }}
                style={{
                  textAlign: "left",
                  padding: "0.3rem 0.5rem",
                  border: "none",
                  background: value === opt ? "var(--color-surface-hover)" : "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: value === opt ? 700 : 400,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function ActivityStats({ items }) {
  const stats = useMemo(() => {
    const done = items.filter((i) => i.status === "done");
    const byType = {};
    done.forEach((i) => {
      const t = i.activityType || "Other";
      byType[t] = (byType[t] || 0) + 1;
    });
    return { total: done.length, byType };
  }, [items]);

  if (stats.total === 0) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #F0FAF6 0%, #EAF8FE 100%)",
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
        Your adventures
      </div>
      <div>
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#2EB67D" }}>{stats.total}</span>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>completed</span>
      </div>
      {Object.entries(stats.byType).slice(0, 4).map(([type, count]) => (
        <div key={type}>
          <span style={{ fontWeight: 700, color: "#2EB67D" }}>{count}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>{type}</span>
        </div>
      ))}
    </div>
  );
}

function ActivityList() {
  const [activityTypeFilter, setActivityTypeFilter] = React.useState("all");

  const {
    items: activities,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
  } = useCategory("activities", { schema: activitySchema });

  const activityStatuses = getStatusFilterOptions("activities");
  const statusFiltered = filterByStatus(activities, filterStatus);
  const filteredActivities = activityTypeFilter === "all"
    ? statusFiltered
    : statusFiltered.filter((i) => i.activityType === activityTypeFilter);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>🏔️ Activities</h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Log Activity
        </Button>
      </div>

      <ActivityStats items={activities} />

      <StatusToggle
        category="activities"
        options={activityStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      <ActivityTypeFilter value={activityTypeFilter} onChange={setActivityTypeFilter} />

      {filteredActivities.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "#2EB67D", color: "#fff" }}>
            🏔️
          </div>
          <div className="empty-state-title">
            {activities.length === 0 ? "No adventures yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {activities.length === 0
              ? "Log your first activity — snowboarding, hiking, surfing, and more."
              : "No activities match this filter."}
          </div>
          {activities.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Log Your First Activity
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="activities"
        items={filteredActivities}
        schema={activitySchema}
        onEdit={startEditing}
        onDelete={deleteItem}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Activity" : "Log Activity"}
      >
        <ActivityForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Activity logged ✅"
      />

      <SnapCaptureModal
        show={showSnapPrompt}
        onClose={dismissSnapPrompt}
        onSave={handleSnapSave}
        itemTitle={snapPromptTitle}
      />
    </>
  );
}

export default ActivityList;
