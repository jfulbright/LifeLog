import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import ItemForm from "./shared/ItemForm";
import ItemCardList from "./shared/ItemCardList";
import { travelSchema } from "../utils/schemas";

function TravelList() {
  const [travels, setTravels] = useState(() => {
    const saved = localStorage.getItem("travels");
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Save to localStorage whenever travel list changes
  useEffect(() => {
    localStorage.setItem("travels", JSON.stringify(travels));
  }, [travels]);

  const handleAddTravel = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      // Update existing item
      setTravels((prev) =>
        prev.map((t, i) => (i === editIndex ? formData : t))
      );
      setEditIndex(null);
    } else {
      // Add new item
      setTravels([...travels, formData]);
    }

    setFormData({});
    setShowForm(false);
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

  return (
    <>
      {!showForm && (
        <Button
          variant="primary"
          className="mb-3"
          onClick={() => setShowForm(true)}
        >
          Add Travel Entry
        </Button>
      )}

      {showForm && (
        <ItemForm
          schema={travelSchema}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddTravel}
          title="Add a Travel Destination"
          buttonText={
            editIndex !== null ? "Update Travel Entry" : "Add Travel Entry"
          }
        />
      )}

      <ItemCardList
        title="Places I've Traveled or Plan to Visit"
        items={travels}
        schema={travelSchema}
        onEdit={startEditing}
        onDelete={deleteTravel}
      />
    </>
  );
}

export default TravelList;
