// client/src/features/homes/HomeList.js

import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import HomeForm from "features/homes/components/HomeForm";
import ItemCardList from "components/shared/ItemCardList";
import homeSchema from "features/homes/homeSchema";

// Shared filter utilities for status options and filtering logic
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "helpers/filterUtils";

function HomeList() {
  // Load saved homes from localStorage when component mounts
  const [homes, setHomes] = useState(() => {
    const saved = localStorage.getItem("homes");
    return saved ? JSON.parse(saved) : [];
  });

  // State for current form data, visibility, and editing
  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Tracks selected filter (e.g., "owned", "rented", "wishlist")
  const [filterStatus, setFilterStatus] = useState("all");

  // Save homes to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem("homes", JSON.stringify(homes));
  }, [homes]);

  // Add a new home or update an existing one
  const handleAddHome = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      // Update existing home
      setHomes((prev) =>
        prev.map((home, i) => (i === editIndex ? formData : home))
      );
      setEditIndex(null);
    } else {
      // Add new home
      setHomes([...homes, formData]);
    }

    setFormData({});
    setShowForm(false);
  };

  // Populate form for editing a specific home
  const startEditing = (index) => {
    setFormData(homes[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  // Delete a home and reset form if needed
  const deleteHome = (index) => {
    setHomes((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setFormData({});
      setEditIndex(null);
      setShowForm(false);
    }
  };

  // Get list of filter options for the dropdown
  const homeStatuses = getStatusFilterOptions("homes");

  // Filter homes based on selected status
  const filteredHomes = filterByStatus(homes, filterStatus);

  // Dynamically update title based on filter
  const sectionTitle = `Homes - ${getStatusLabel("homes", filterStatus)}`;

  return (
    <>
      {/* Show "Add Home" button when form is hidden */}
      {!showForm && (
        <Button
          variant="primary"
          className="mb-3"
          onClick={() => setShowForm(true)}
        >
          Add Home
        </Button>
      )}

      {/* Show form for adding or editing */}
      {showForm && (
        <HomeForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddHome}
        />
      )}

      {/* Status filter dropdown */}
      <div className="mb-3">
        <label>Status Filter: </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {homeStatuses.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel("homes", status)}
            </option>
          ))}
        </select>
      </div>

      {/* Render list of filtered homes using reusable card list */}
      <ItemCardList
        title={sectionTitle}
        items={filteredHomes}
        schema={homeSchema}
        onEdit={startEditing}
        onDelete={deleteHome}
      />
    </>
  );
}

export default HomeList;
