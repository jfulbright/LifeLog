import React from "react";
import { Button } from "react-bootstrap";
import CarForm from "features/cars/components/CarForm";
import ItemCardList from "components/shared/ItemCardList";
import StatusToggle from "components/shared/StatusToggle";
import FormPanel from "components/shared/FormPanel";
import SaveToast from "components/shared/SaveToast";
import carSchema from "features/cars/carSchema";
import useCategory from "hooks/useCategory";

import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "helpers/filterUtils";

function CarList() {
  const {
    items: cars,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
  } = useCategory("cars", { schema: carSchema });

  const carStatuses = getStatusFilterOptions("cars");
  const filteredCars = filterByStatus(cars, filterStatus);
  const sectionTitle = `Cars - ${getStatusLabel("cars", filterStatus)}`;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Cars</h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Add Car
        </Button>
      </div>

      <StatusToggle
        category="cars"
        options={carStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      {filteredCars.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-cars)", color: "#fff" }}>
            &#128663;
          </div>
          <div className="empty-state-title">
            {cars.length === 0 ? "No cars yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {cars.length === 0
              ? "Add your first car to start tracking."
              : "No cars found for this filter."}
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
        message="Car saved"
      />
    </>
  );
}

export default CarList;
