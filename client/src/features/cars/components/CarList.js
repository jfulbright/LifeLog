import React from "react";
import { Badge, Button } from "react-bootstrap";
import CarForm from "../../../features/cars/components/CarForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import MaintenanceSection, { NextServiceSummary } from "../../../components/shared/MaintenanceSection";
import { RATING_PILL_OPTIONS, matchesRatingValue } from "../../../components/shared/GroupedDropdownFilter";
import carSchema from "../../../features/cars/carSchema";
import useCategory from "../../../hooks/useCategory";
import useListFilters from "../../../hooks/useListFilters";
import { useAppData } from "../../../contexts/AppDataContext";
import { useAuth } from "../../../contexts/AuthContext";
import { resolveUserName, summarizeMaintenance } from "../../../helpers/maintenanceStatus";
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

// Cars often lack a purchase date; fall back to the model year so the Year
// filter still groups them. Module-level for a stable dateField identity.
const CAR_DATE = (c) => c.startDate || (c.year ? `${c.year}-01-01` : c.createdAt);

function CarList() {
  const [ratingFilter, setRatingFilter] = React.useState("all");
  const { profile } = useAppData();
  const { user } = useAuth();
  const {
    items: cars,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm, saveDetailEdit,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("cars", { schema: carSchema });

  // Persist maintenance changes (adopt plan / log service) through the same
  // own-vs-shared save path the detail edit uses, then keep an open detail
  // panel in sync so the new entry shows immediately.
  const handleMaintenancePersist = React.useCallback((updatedItem) => {
    saveDetailEdit(updatedItem);
    setViewDetailItem((prev) => (prev && prev.id === updatedItem.id ? updatedItem : prev));
  }, [saveDetailEdit, setViewDetailItem]);

  const renderMaintenanceBadge = React.useCallback((item) => {
    const { overdueCount, dueSoonCount } = summarizeMaintenance(item);
    if (overdueCount + dueSoonCount === 0) return null;
    if (overdueCount > 0) {
      return <Badge bg="danger">{overdueCount} overdue</Badge>;
    }
    return <Badge bg="warning" text="dark">{dueSoonCount} due soon</Badge>;
  }, []);

  const renderMaintenance = React.useCallback((item) => (
    <MaintenanceSection
      item={item}
      category="cars"
      canEdit={!item._isShared || item._canEdit}
      onPersist={handleMaintenancePersist}
      currentUserId={user?.id}
      currentUserName={resolveUserName(profile, user)}
    />
  ), [handleMaintenancePersist, user, profile]);

  const carStatuses = getStatusFilterOptions("cars");
  const statusFiltered = filterByStatus(cars, filterStatus);
  const lf = useListFilters(cars, { dateField: CAR_DATE });
  const commonFiltered = lf.applyCommonFilters(statusFiltered);

  const filteredCars = React.useMemo(() => {
    if (ratingFilter === "all") return commonFiltered;
    return commonFiltered.filter((i) => matchesRatingValue(i.rating, ratingFilter));
  }, [commonFiltered, ratingFilter]);

  const carPills = [
    { key: "rating", label: "★ Rating", value: ratingFilter, onChange: setRatingFilter, options: RATING_PILL_OPTIONS },
  ];

  const sectionTitle = `Cars - ${getStatusLabel("cars", filterStatus)}`;

  return (
    <>
      <CategoryListHeader
        title={"\u{1F697} Cars"}
        addLabel="+ Add Car"
        onAdd={openForm}
        stats={cars.length > 0 ? [
          { value: cars.length, label: "logged", color: "var(--color-cars, #36C5F0)" },
        ] : null}
        category="cars"
        statusOptions={carStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        yearOptions={lf.yearOptions}
        activeYear={lf.activeYear}
        onYearChange={lf.setActiveYear}
        filterPills={carPills}
        filterColor="var(--color-cars, #36C5F0)"
        sourceFilter={lf.sourceFilter}
        onSourceChange={lf.setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={lf.sharedCount}
        recommendedCount={lf.recommendedCount}
      />

      {filteredCars.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-cars)", color: "#fff" }}>
            &#128663;
          </div>
          <div className="empty-state-title">
            {cars.length === 0 ? "No cars yet \u{1F697}" : "No matches"}
          </div>
          <div className="empty-state-text">
            {cars.length === 0
              ? "Add your first car to start tracking."
              : "No cars match this filter."}
          </div>
          {cars.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Add Your First Car
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="cars"
        title={sectionTitle}
        items={filteredCars}
        schema={carSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
        onViewDetail={setViewDetailItem}
        renderItemExtras={renderMaintenance}
        renderCompactExtra={renderMaintenanceBadge}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Car" : "Add Car"}
      >
        <CarForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message={"Car saved \u2705"}
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
          category="cars"
          schema={carSchema}
          onClose={() => setViewDetailItem(null)}
          onSave={(data) => { saveDetailEdit(data); setViewDetailItem(null); }}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
          renderItemExtras={renderMaintenance}
          headerExtra={(item) => <NextServiceSummary item={item} hasMileage />}
        />
      )}
    </>
  );
}

export default CarList;
