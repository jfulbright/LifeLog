import React from "react";
import { Button } from "react-bootstrap";
import CarForm from "../../../features/cars/components/CarForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_GROUP } from "../../../components/shared/GroupedDropdownFilter";
import carSchema from "../../../features/cars/carSchema";
import useCategory from "../../../hooks/useCategory";
import { useAppData } from "../../../contexts/AppDataContext";
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

function CarList() {
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [carFilter, setCarFilter] = React.useState("all");
  const { profile } = useAppData();
  const {
    items: cars,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("cars", { schema: carSchema });

  const carStatuses = getStatusFilterOptions("cars");
  const statusFiltered = filterByStatus(cars, filterStatus);
  const sourceFiltered = sourceFilter === "mine"
    ? statusFiltered.filter((i) => !i._isShared)
    : sourceFilter === "shared"
    ? statusFiltered.filter((i) => i._isShared)
    : sourceFilter === "recommended"
    ? statusFiltered.filter((i) => i._isRecommended)
    : statusFiltered;

  const filteredCars = React.useMemo(() => {
    if (carFilter === "all") return sourceFiltered;
    if (carFilter.startsWith("rating:")) {
      const rVal = carFilter.split(":")[1];
      return sourceFiltered.filter((i) => {
        const r = parseInt(i.rating, 10);
        if (rVal === "unrated") return !r;
        if (rVal === "5") return r === 5;
        if (rVal === "4+") return r >= 4;
        if (rVal === "3+") return r >= 3;
        return true;
      });
    }
    return sourceFiltered;
  }, [sourceFiltered, carFilter]);

  const sharedCount = cars.filter((i) => i._isShared).length;
  const recommendedCount = cars.filter((i) => i._isRecommended).length;
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
        filterGroups={[RATING_GROUP]}
        filterValue={carFilter}
        onFilterChange={setCarFilter}
        filterColor="var(--color-cars, #36C5F0)"
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={sharedCount}
        recommendedCount={recommendedCount}
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
        message="Car saved \u2705"
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
          onSave={() => setViewDetailItem(null)}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
        />
      )}
    </>
  );
}

export default CarList;
