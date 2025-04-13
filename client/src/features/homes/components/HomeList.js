// client/src/features/homes/HomeList.js

import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import HomeForm from "features/homes//components/HomeForm";
import ItemCardList from "components/shared/ItemCardList";
import homeSchema from "features/homes/homeSchema";

function HomeList() {
  const [homes, setHomes] = useState(() => {
    const saved = localStorage.getItem("homes");
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem("homes", JSON.stringify(homes));
  }, [homes]);

  const handleAddHome = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      setHomes((prev) =>
        prev.map((home, i) => (i === editIndex ? formData : home))
      );
      setEditIndex(null);
    } else {
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
