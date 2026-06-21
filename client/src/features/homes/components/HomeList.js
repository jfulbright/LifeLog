import React from "react";
import { Button } from "react-bootstrap";
import HomeForm from "../../../features/homes/components/HomeForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import MaintenanceSection from "../../../components/shared/MaintenanceSection";
import { RATING_PILL_OPTIONS, matchesRatingValue } from "../../../components/shared/GroupedDropdownFilter";
import homeSchema from "../../../features/homes/homeSchema";
import useCategory from "../../../hooks/useCategory";
import useListFilters from "../../../hooks/useListFilters";
import { useAppData } from "../../../contexts/AppDataContext";
import { useAuth } from "../../../contexts/AuthContext";
import { resolveUserName } from "../../../helpers/maintenanceStatus";
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

// Homes have no startDate — they record purchase/sold dates. Module-level for a
// stable dateField identity across renders.
const HOME_DATE_FIELDS = ["purchaseDate", "soldDate", "createdAt"];

function HomeList() {
  const [ratingFilter, setRatingFilter] = React.useState("all");
  const { profile } = useAppData();
  const { user } = useAuth();
  const {
    items: homes,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm, saveDetailEdit,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("homes", { schema: homeSchema });

  // Persist maintenance changes through the own-vs-shared save path, keeping an
  // open detail panel in sync (see CarList for the same pattern).
  const handleMaintenancePersist = React.useCallback((updatedItem) => {
    saveDetailEdit(updatedItem);
    setViewDetailItem((prev) => (prev && prev.id === updatedItem.id ? updatedItem : prev));
  }, [saveDetailEdit, setViewDetailItem]);

  const renderMaintenance = React.useCallback((item) => (
    <MaintenanceSection
      item={item}
      category="homes"
      canEdit={!item._isShared || item._canEdit}
      onPersist={handleMaintenancePersist}
      currentUserId={user?.id}
      currentUserName={resolveUserName(profile, user)}
    />
  ), [handleMaintenancePersist, user, profile]);

  const homeStatuses = getStatusFilterOptions("homes");
  const statusFiltered = filterByStatus(homes, filterStatus);
  const lf = useListFilters(homes, { dateField: HOME_DATE_FIELDS });
  const commonFiltered = lf.applyCommonFilters(statusFiltered);

  const filteredHomes = React.useMemo(() => {
    if (ratingFilter === "all") return commonFiltered;
    return commonFiltered.filter((i) => matchesRatingValue(i.rating, ratingFilter));
  }, [commonFiltered, ratingFilter]);

  const homePills = [
    { key: "rating", label: "★ Rating", value: ratingFilter, onChange: setRatingFilter, options: RATING_PILL_OPTIONS },
  ];

  const sectionTitle = `Homes - ${getStatusLabel("homes", filterStatus)}`;

  return (
    <>
      <CategoryListHeader
        title={"\u{1F3E0} Homes"}
        addLabel="+ Add Home"
        onAdd={openForm}
        stats={homes.length > 0 ? [
          { value: homes.length, label: "logged", color: "var(--color-homes, #2EB67D)" },
        ] : null}
        category="homes"
        statusOptions={homeStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        yearOptions={lf.yearOptions}
        activeYear={lf.activeYear}
        onYearChange={lf.setActiveYear}
        filterPills={homePills}
        filterColor="var(--color-homes, #2EB67D)"
        sourceFilter={lf.sourceFilter}
        onSourceChange={lf.setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={lf.sharedCount}
        recommendedCount={lf.recommendedCount}
      />

      {filteredHomes.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-homes)", color: "#fff" }}>
            &#127968;
          </div>
          <div className="empty-state-title">
            {homes.length === 0 ? "No homes yet \u{1F3E0}" : "No matches"}
          </div>
          <div className="empty-state-text">
            {homes.length === 0
              ? "Add your first home to start tracking."
              : "No homes match this filter."}
          </div>
          {homes.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Add Your First Home
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="homes"
        title={sectionTitle}
        items={filteredHomes}
        schema={homeSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
        onViewDetail={setViewDetailItem}
        renderItemExtras={renderMaintenance}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Home" : "Add Home"}
      >
        <HomeForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message={"Home saved \u2705"}
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
          category="homes"
          schema={homeSchema}
          onClose={() => setViewDetailItem(null)}
          onSave={(data) => { saveDetailEdit(data); setViewDetailItem(null); }}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
          renderItemExtras={renderMaintenance}
        />
      )}
    </>
  );
}

export default HomeList;
