import React from "react";
import { Button } from "react-bootstrap";
import TravelForm from "features/travel/components/TravelForm";
import ItemCardList from "components/shared/ItemCardList";
import StatusToggle from "components/shared/StatusToggle";
import FormPanel from "components/shared/FormPanel";
import SaveToast from "components/shared/SaveToast";
import SnapCaptureModal from "components/shared/SnapCaptureModal";
import travelSchema from "features/travel/travelSchema";
import useCategory from "hooks/useCategory";

import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "helpers/filterUtils";

function migrateMemoryToSnapshot(item) {
  if (item.memory1 !== undefined || item.memory2 !== undefined || item.memory3 !== undefined) {
    const migrated = { ...item };
    if (migrated.memory1 !== undefined) { migrated.snapshot1 = migrated.snapshot1 || migrated.memory1; delete migrated.memory1; }
    if (migrated.memory2 !== undefined) { migrated.snapshot2 = migrated.snapshot2 || migrated.memory2; delete migrated.memory2; }
    if (migrated.memory3 !== undefined) { migrated.snapshot3 = migrated.snapshot3 || migrated.memory3; delete migrated.memory3; }
    return migrated;
  }
  return item;
}

function TravelList() {
  const {
    items: travels,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
  } = useCategory("travel", { migrate: migrateMemoryToSnapshot, schema: travelSchema });

  const travelStatuses = getStatusFilterOptions("travel");
  const filteredTravels = filterByStatus(travels, filterStatus);
  const sectionTitle = `Travel - ${getStatusLabel("travel", filterStatus)}`;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Travel</h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Add Trip
        </Button>
      </div>

      <StatusToggle
        category="travel"
        options={travelStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      {filteredTravels.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-travel)", color: "#fff" }}>
            &#9992;&#65039;
          </div>
          <div className="empty-state-title">
            {travels.length === 0 ? "No trips yet ✈️" : "No matches"}
          </div>
          <div className="empty-state-text">
            {travels.length === 0
              ? "Add your first trip to start tracking."
              : "No trips match this filter."}
          </div>
          {travels.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Add Your First Trip
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="travel"
        title={sectionTitle}
        items={filteredTravels}
        schema={travelSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Trip" : "Add Trip"}
      >
        <TravelForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Trip saved ✅"
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

export default TravelList;
