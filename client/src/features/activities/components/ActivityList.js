import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import ActivityForm from "./ActivityForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import TripLink from "../../../components/shared/TripLink";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_PILL_OPTIONS, matchesRatingValue } from "../../../components/shared/GroupedDropdownFilter";
import activitySchema, { ACTIVITY_TYPES } from "../activitySchema";
import useCategory from "../../../hooks/useCategory";
import useListFilters from "../../../hooks/useListFilters";
import { useAppData } from "../../../contexts/AppDataContext";
import {
  getStatusFilterOptions,
  filterByStatus,
} from "../../../helpers/filterUtils";

// Every activity sub-category, flattened into one "Type" dropdown's options.
const ACTIVITY_TYPE_OPTIONS = Object.values(ACTIVITY_TYPES).flatMap((g) =>
  g.options.map((opt) => ({ value: opt, label: opt }))
);

function ActivityList() {
  const location = useLocation();
  const [activityTypeFilter, setActivityTypeFilter] = React.useState("all");
  const [ratingFilter, setRatingFilter] = React.useState("all");
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
    viewDetailItem, setViewDetailItem, saveDetailEdit,
  } = useCategory("activities", { schema: activitySchema });

  const lf = useListFilters(activities, { dateField: "startDate" });

  useEffect(() => {
    const pre = location.state?.prefilledTripTitle;
    if (pre) {
      openForm();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activityStatuses = getStatusFilterOptions("activities");
  const statusFiltered = filterByStatus(activities, filterStatus);
  const commonFiltered = lf.applyCommonFilters(statusFiltered);
  const filteredActivities = React.useMemo(() => {
    let items = commonFiltered;
    if (activityTypeFilter !== "all") items = items.filter((i) => i.activityType === activityTypeFilter);
    if (ratingFilter !== "all") items = items.filter((i) => matchesRatingValue(i.rating, ratingFilter));
    return items;
  }, [commonFiltered, activityTypeFilter, ratingFilter]);

  const activityPills = [
    { key: "activityType", label: "\u{1F3D4}️ Type", value: activityTypeFilter, onChange: setActivityTypeFilter, options: ACTIVITY_TYPE_OPTIONS },
    { key: "rating", label: "★ Rating", value: ratingFilter, onChange: setRatingFilter, options: RATING_PILL_OPTIONS },
  ];

  const done = activities.filter((i) => i.status === "done");

  return (
    <>
      <CategoryListHeader
        title={"\u{1F3D4}\uFE0F Activities"}
        addLabel="+ Log Activity"
        onAdd={openForm}
        stats={done.length > 0 ? (() => {
          const types = new Set(done.map((a) => a.activityType).filter(Boolean));
          const rated = done.filter((a) => a.rating > 0);
          const avgRating = rated.length > 0 ? (rated.reduce((s, a) => s + a.rating, 0) / rated.length).toFixed(1) : null;
          const wishlist = activities.filter((a) => a.status === "wishlist");
          const stats = [
            { value: done.length, label: "accomplished", color: "#2EB67D" },
          ];
          if (types.size > 0) stats.push({ value: types.size, label: "types", color: "var(--color-primary)" });
          if (avgRating) stats.push({ value: avgRating + "★", label: "avg", color: "var(--color-warning)" });
          if (wishlist.length > 0) stats.push({ value: wishlist.length, label: "bucket list", color: "var(--color-text-secondary)" });
          return stats;
        })() : null}
        statsLink={{ to: "/activities/stats", color: "var(--color-activities, #2EB67D)" }}
        category="activities"
        statusOptions={activityStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        yearOptions={lf.yearOptions}
        activeYear={lf.activeYear}
        onYearChange={lf.setActiveYear}
        filterPills={activityPills}
        filterColor="var(--color-activities, #2EB67D)"
        sourceFilter={lf.sourceFilter}
        onSourceChange={lf.setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={lf.sharedCount}
        recommendedCount={lf.recommendedCount}
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
            <div style={{ marginTop: "0.2rem" }}>
              <TripLink tripId={item.linkedTripId} title={item.linkedTripTitle} />
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
        message={"Activity logged \u2705"}
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
            saveDetailEdit(updatedData);
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
