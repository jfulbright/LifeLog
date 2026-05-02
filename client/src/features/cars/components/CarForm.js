// client/src/features/cars/CarForm.js

import React from "react";
import ItemForm from "components/shared/ItemForm";
import carSchema from "features/cars/carSchema";
import { fetchCarDataFromVin } from "features/cars/api/carApi";

/**
 * CarForm uses the shared ItemForm component.
 * Keeps UI and logic consistent with other forms.
 */
function CarForm({ formData, setFormData, onSubmit }) {
  const handleVinLookup = async () => {
    if (!formData.vin) return;

    try {
      const vinData = await fetchCarDataFromVin(formData.vin);
      setFormData((prev) => ({ ...prev, ...vinData }));
    } catch (error) {
      console.error("VIN lookup failed:", error);
    }
  };

  return (
    <>
      <div className="d-flex gap-2 align-items-center mb-4">
        <input
          type="text"
          placeholder="Enter VIN"
          value={formData.vin || ""}
          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          className="form-control"
        />
        <button
          onClick={handleVinLookup}
          className="btn btn-primary"
        >
          Lookup
        </button>
      </div>

      <ItemForm
        schema={carSchema}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        title="Add a Car"
        buttonText="Add Car"
      />
    </>
  );
}

export default CarForm;
