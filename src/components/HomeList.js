import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import HomeForm from "../components/HomeForm";
import ItemCardList from "../components/shared/ItemCardList";
import { homeSchema } from "../utils/schemas";

function HomeList() {
  const [homes, setHomes] = useState(() => {
    const saved = localStorage.getItem("homes");
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem("homes", JSON.stringify(homes));
  }, [homes]);

  const handleAddHome = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      // Save update
      setHomes((prev) =>
        prev.map((home, i) => (i === editIndex ? formData : home))
      );
      setEditIndex(null);
    } else {
      // Add new
      setHomes([...homes, formData]);
    }

    setFormData({});
    setShowForm(false);
  };

  const startEditing = (index) => {
    setFormData(homes[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const deleteHome = (index) => {
    setHomes((prev) => prev.filter((_, i) => i !== index));
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
          Add Home
        </Button>
      )}

      {showForm && (
        <HomeForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddHome}
        />
      )}

      <ItemCardList
        title="Homes I've Owned"
        items={homes}
        schema={homeSchema}
        onEdit={startEditing}
        onDelete={deleteHome}
      />
    </>
  );
}

export default HomeList;
