import React from "react";
import { Button } from "react-bootstrap";
import HomeForm from "features/homes/components/HomeForm";
import ItemCardList from "components/shared/ItemCardList";
import StatusToggle from "components/shared/StatusToggle";
import FormPanel from "components/shared/FormPanel";
import SaveToast from "components/shared/SaveToast";
import SnapCaptureModal from "components/shared/SnapCaptureModal";
import homeSchema from "features/homes/homeSchema";
import useCategory from "hooks/useCategory";

import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "helpers/filterUtils";

function HomeList() {
  const {
    items: homes,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
  } = useCategory("homes", { schema: homeSchema });

  const homeStatuses = getStatusFilterOptions("homes");
  const filteredHomes = filterByStatus(homes, filterStatus);
  const sectionTitle = `Homes - ${getStatusLabel("homes", filterStatus)}`;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Homes</h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Add Home
        </Button>
      </div>

      <StatusToggle
        category="homes"
        options={homeStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      {filteredHomes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-homes)", color: "#fff" }}>
            &#127968;
          </div>
          <div className="empty-state-title">
            {homes.length === 0 ? "No homes yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {homes.length === 0
              ? "Add your first home to start tracking."
              : "No homes found for this filter."}
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
        message="Home saved"
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

export default HomeList;
