import React from "react";
import { Button } from "react-bootstrap";
import concertSchema from "features/concerts/concertSchema";
import ConcertForm from "./ConcertForm";
import ItemCardList from "components/shared/ItemCardList";
import StatusToggle from "components/shared/StatusToggle";
import FormPanel from "components/shared/FormPanel";
import SaveToast from "components/shared/SaveToast";
import SnapCaptureModal from "components/shared/SnapCaptureModal";
import useCategory from "hooks/useCategory";

import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "helpers/filterUtils";

function normalizeConcert(data) {
  const updated = {
    ...data,
    setlist: Array.isArray(data.setlist) ? data.setlist : [],
    status: data.status || "wishlist",
    startDate: data.startDate || data.date || "",
    endDate: data.endDate || data.date || "",
  };
  delete updated.date;
  return updated;
}

function ConcertList() {
  const {
    items: concerts,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
  } = useCategory("concerts", { normalize: normalizeConcert, schema: concertSchema });

  const concertStatuses = getStatusFilterOptions("concerts");
  const filteredConcerts = filterByStatus(concerts, filterStatus);
  const sectionTitle = `Concerts - ${getStatusLabel("concerts", filterStatus)}`;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Concerts</h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Add Concert
        </Button>
      </div>

      <StatusToggle
        category="concerts"
        options={concertStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      {filteredConcerts.length === 0 && !showForm && (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-concerts)", color: "#fff" }}
          >
            &#9835;
          </div>
          <div className="empty-state-title">
            {concerts.length === 0 ? "No concerts yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {concerts.length === 0
              ? "Search Setlist.fm or add one manually to get started."
              : "No concerts found for this filter."}
          </div>
          {concerts.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Add Your First Concert
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="concerts"
        title={sectionTitle}
        items={filteredConcerts}
        schema={concertSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Concert" : "Add Concert"}
      >
        <ConcertForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Concert saved"
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

export default ConcertList;
