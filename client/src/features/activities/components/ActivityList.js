import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import ActivityForm from "./ActivityForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_GROUP } from "../../../components/shared/GroupedDropdownFilter";
import activitySchema, { ACTIVITY_TYPES } from "../activitySchema";
import useCategory from "../../../hooks/useCategory";
import { useAppData } from "../../../contexts/AppDataContext";
import {
  getStatusFilterOptions,
  filterByStatus,
} from "../../../helpers/filterUtils";

function ActivityList() {
  const location = useLocation();
  const [activityTypeFilter, setActivityTypeFilter] = React.useState("all");
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const { profile } = useAppData();

  const {
    items: activities,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("activities", { schema: activitySchema });

  useEffect(() => {
    const pre = location.state?.prefilledTripTitle;
    if (pre) {
      openForm();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activityStatuses = getStatusFilterOptions("activities");
  const statusFiltered = filterByStatus(activities, filterStatus);
  const sourceFiltered = sourceFilter === "mine"
    ? statusFiltered.filter((i) => !i._isShared)
    : sourceFilter === "shared"
    ? statusFiltered.filter((i) => i._isShared)
    : sourceFilter === "recommended"
    ? statusFiltered.filter((i) => i._isRecommended)
    : statusFiltered;
  const filteredActivities = React.useMemo(() => {
    if (activityTypeFilter === "all") return sourceFiltered;
    if (activityTypeFilter.startsWith("rating:")) {
      const rVal = activityTypeFilter.split(":")[1];
      return sourceFiltered.filter((i) => {
        const r = parseInt(i.rating, 10);
        if (rVal === "unrated") return !r;
        if (rVal === "5") return r === 5;
        if (rVal === "4+") return r >= 4;
        if (rVal === "3+") return r >= 3;
        return true;
      });
    }
    return sourceFiltered.filter((i) => i.activityType === activityTypeFilter);
  }, [sourceFiltered, activityTypeFilter]);
  const sharedCount = activities.filter((i) => i._isShared).length;
  const recommendedCount = activities.filter((i) => i._isRecommended).length;

  const done = activities.filter((i) => i.status === "done");

  return (
    <>
      <CategoryListHeader
        title={"\u{1F3D4}\uFE0F Activities"}
        addLabel="+ Log Activity"
        onAdd={openForm}
        stats={done.length > 0 ? [
          { value: done.length, label: "accomplished", color: "#2EB67D" },
        ] : null}
        category="activities"
        statusOptions={activityStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterGroups={[
          ...Object.entries(ACTIVITY_TYPES).map(([key, g]) => ({
            key,
            label: g.label,
            options: g.options.map((opt) => ({ value: opt, label: opt })),
          })),
          RATING_GROUP,
        ]}
        filterValue={activityTypeFilter}
        onFilterChange={setActivityTypeFilter}
        filterColor="var(--color-activities, #2EB67D)"
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={sharedCount}
        recommendedCount={recommendedCount}
      />

      {filteredActivities.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "#2EB67D", color: "#fff" }}>
            {"🏔️"}
          </div>
          <div className="empty-state-title">
            {activities.length === 0 ? "No adventures yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {activities.length === 0
              ? "Log your first activity \u2014 snowboarding, hiking, surfing, and more."
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
        onViewDetail={setViewDetailItem}
        renderCompactExtra={(item) =>
          item.linkedTripTitle ? (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              marginTop: "0.2rem",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-tertiary)",
            }}>
              {"\u2708\uFE0F"} {item.linkedTripTitle}
            </div>
          ) : null
        }
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
        message="Activity logged \u2705"
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
          category="activities"
          schema={activitySchema}
          onClose={() => setViewDetailItem(null)}
          onSave={(updatedData) => {
            setViewDetailItem(null);
          }}
          onDelete={(id) => {
            deleteItem(id);
            setViewDetailItem(null);
          }}
        />
      )}
    </>
  );
}

export default ActivityList;
