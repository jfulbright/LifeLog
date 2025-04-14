// client/src/features/cars/CarList.js

import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import CarForm from "features/cars/components/CarForm";
import ItemCardList from "components/shared/ItemCardList";
import ItemExtras from "components/shared/ItemExtras";
import carSchema from "features/cars/carSchema";

// Helpers to manage status filter logic across all categories
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "helpers/filterUtils";

function CarList() {
  // Retrieve saved cars from localStorage on load
  const [cars, setCars] = useState(() => {
    const saved = localStorage.getItem("cars");
    return saved ? JSON.parse(saved) : [];
  });

  // Form data state (used for both adding and editing)
  const [formData, setFormData] = useState({});

  // Toggles whether the form is visible
  const [showForm, setShowForm] = useState(false);

  // Tracks which item (by index) is being edited, if any
  const [editIndex, setEditIndex] = useState(null);

  // Tracks selected filter status ("all", "owned", "wishlist", etc.)
  const [filterStatus, setFilterStatus] = useState("all");

  // Save cars to localStorage whenever the list updates
  useEffect(() => {
    localStorage.setItem("cars", JSON.stringify(cars));
  }, [cars]);

  // Handles form submission to add or update a car
  const handleAddCar = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      // If editing, update the item at the given index
      setCars((prev) =>
        prev.map((car, i) => (i === editIndex ? formData : car))
      );
      setEditIndex(null);
    } else {
      // Otherwise, add a new item to the list
      setCars([...cars, formData]);
    }

    setFormData({});
    setShowForm(false);
  };

  // Initiates editing for the selected item
  const startEditing = (index) => {
    setFormData(cars[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  // Removes an item from the list and resets form if needed
  const deleteCar = (index) => {
    setCars((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setFormData({});
      setEditIndex(null);
      setShowForm(false);
    }
  };

  // Pull the list of status options for the dropdown
  const carStatuses = getStatusFilterOptions("cars");

  // Filter the list based on the selected status (e.g., "owned")
  const filteredCars = filterByStatus(cars, filterStatus);

  // Update the section title dynamically based on current filter
  const sectionTitle = `Cars - ${getStatusLabel("cars", filterStatus)}`;

  return (
    <>
      {/* Show "Add Car" button only when form is hidden */}
      {!showForm && (
        <Button
          variant="primary"
          className="mb-3"
          onClick={() => setShowForm(true)}
        >
          Add Car
        </Button>
      )}

      {/* Render the form when adding or editing */}
      {showForm && (
        <CarForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddCar}
        />
      )}

      {/* Dropdown to filter cars by status (e.g. Owned, Wishlist) */}
      <div className="mb-3">
        <label>Status Filter: </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {carStatuses.map((status) => (
            <option key={status} value={status}>
              {getStatusLabel("cars", status)}
            </option>
          ))}
        </select>
      </div>

      {/* Reusable card list for displaying car entries */}
      <ItemCardList
        title={sectionTitle}
        items={filteredCars}
        schema={carSchema}
        onEdit={startEditing}
        onDelete={deleteCar}
        renderItemExtras={(item) => <ItemExtras item={item} />}
      />
    </>
  );
}

export default CarList;
