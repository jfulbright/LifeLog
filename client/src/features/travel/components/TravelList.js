// client/src/features/travel/TravelList.js

import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import TravelForm from "features/travel/components/TravelForm";
import ItemCardList from "components/shared/ItemCardList";
import travelSchema from "features/travel/travelSchema";

// Shared helpers for filtering logic
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "helpers/filterUtils";

function TravelList() {
  // Load travels from localStorage when the component mounts
  const [travels, setTravels] = useState(() => {
    const saved = localStorage.getItem("travels");
    return saved ? JSON.parse(saved) : [];
  });

  // State for form data, visibility, editing index
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Track current filter (e.g., "visited", "wishlist")
  const [filterStatus, setFilterStatus] = useState("all");

  // Save updated travels back to localStorage
  useEffect(() => {
    localStorage.setItem("travels", JSON.stringify(travels));
  }, [travels]);

  // Add or update a travel entry
  const handleAddTravel = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      // Edit existing entry
      setTravels((prev) =>
        prev.map((t, i) => (i === editIndex ? formData : t))
      );
      setEditIndex(null);
    } else {
      // Add new entry
      setTravels([...travels, formData]);
    }

    setFormData({});
    setShowForm(false);
  };

  // Start editing an existing entry
  const startEditing = (index) => {
    setFormData(travels[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  // Delete a travel entry
  const deleteTravel = (index) => {
    setTravels((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setFormData({});
      setEditIndex(null);
      setShowForm(false);
    }
  };

  // Pull available status filters for the dropdown
  const travelStatuses = getStatusFilterOptions("travel");

  // Filter entries based on the selected status
  const filteredTravels = filterByStatus(travels, filterStatus);

  // Set a dynamic title based on filter
  const sectionTitle = `Travel - ${getStatusLabel("travel", filterStatus)}`;

  return (
    <>
      {/* Show Add button when form is not open */}
      {!showForm && (
        <Button
          variant="primary"
          className="mb-3"
          onClick={() => setShowForm(true)}
        >
          Add Travel Entry
        </Button>
      )}

      {/* Show form when adding or editing */}
      {showForm && (
        <TravelForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddTravel}
        />
      )}

      {/* Status filter dropdown */}
      <div className="mb-3">
        <label>Status Filter: </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {travelStatuses.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel("travel", status)}
            </option>
          ))}
        </select>
      </div>

      {/* Display the filtered list of travel entries */}
      <ItemCardList
        title={sectionTitle}
        items={filteredTravels}
        schema={travelSchema}
        onEdit={startEditing}
        onDelete={deleteTravel}
      />
    </>
  );
}

export default TravelList;
