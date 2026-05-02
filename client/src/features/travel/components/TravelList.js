import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import TravelForm from "features/travel/components/TravelForm";
import ItemCardList from "components/shared/ItemCardList";
import StatusToggle from "components/shared/StatusToggle";
import FormPanel from "components/shared/FormPanel";
import SaveToast from "components/shared/SaveToast";
import travelSchema from "features/travel/travelSchema";

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
  const [travels, setTravels] = useState(() => {
    const saved = localStorage.getItem("travels");
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return parsed.map(migrateMemoryToSnapshot);
  });
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    localStorage.setItem("travels", JSON.stringify(travels));
  }, [travels]);

  const handleAddTravel = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      setTravels((prev) => prev.map((t, i) => (i === editIndex ? formData : t)));
      setEditIndex(null);
    } else {
      setTravels([...travels, formData]);
    }
    setFormData({});
    setShowForm(false);
    setShowToast(true);
  };

  const startEditing = (index) => {
    setFormData(travels[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const deleteTravel = (index) => {
    setTravels((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setFormData({});
      setEditIndex(null);
      setShowForm(false);
    }
  };

  const closeForm = () => {
    setFormData({});
    setEditIndex(null);
    setShowForm(false);
  };

  const travelStatuses = getStatusFilterOptions("travel");
  const filteredTravels = filterByStatus(travels, filterStatus);
  const sectionTitle = `Travel - ${getStatusLabel("travel", filterStatus)}`;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Travel</h4>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
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
            {travels.length === 0 ? "No trips yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {travels.length === 0
              ? "Add your first trip to start tracking."
              : "No trips found for this filter."}
          </div>
          {travels.length === 0 && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
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
        onDelete={deleteTravel}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Trip" : "Add Trip"}
      >
        <TravelForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddTravel}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Trip saved"
      />
    </>
  );
}

export default TravelList;
