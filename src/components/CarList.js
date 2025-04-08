// CarList.js
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import CarForm from "../components/CarForm";
import ItemCardList from "../components/shared/ItemCardList";
import ItemExtras from "./shared/ItemExtras";
import { carSchema } from "../utils/schemas";

function CarList() {
  const [cars, setCars] = useState(() => {
    const saved = localStorage.getItem("cars");
    return saved ? JSON.parse(saved) : [];
  });

  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem("cars", JSON.stringify(cars));
  }, [cars]);

  const handleAddCar = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      setCars((prev) =>
        prev.map((car, i) => (i === editIndex ? formData : car))
      );
      setEditIndex(null);
    } else {
      setCars([...cars, formData]);
    }

    setFormData({});
    setShowForm(false);
  };

  const startEditing = (index) => {
    setFormData(cars[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const deleteCar = (index) => {
    setCars((prev) => prev.filter((_, i) => i !== index));
    if (editIndex === index) {
      setFormData({});
      setEditIndex(null);
      setShowForm(false);
    }
  };

  const renderItemExtras = (item) => {
    if (!item.icloudLink) return null;
    return (
      <div className="mt-2">
        <a
          href={item.icloudLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          View iCloud Photo Library
        </a>
      </div>
    );
  };

  return (
    <>
      {!showForm && (
        <Button
          variant="primary"
          className="mb-3"
          onClick={() => setShowForm(true)}
        >
          Add Car
        </Button>
      )}

      {showForm && (
        <CarForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddCar}
        />
      )}

      <ItemCardList
        title="Cars I've Owned"
        items={cars}
        schema={carSchema}
        onEdit={startEditing}
        onDelete={deleteCar}
        renderItemExtras={(item) => <ItemExtras item={item} />}
      />
    </>
  );
}

export default CarList;
