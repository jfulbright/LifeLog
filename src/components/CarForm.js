// CarForm.js
import React from "react";
import ItemForm from "./shared/ItemForm";
import { carSchema } from "../utils/schemas";
import { fetchCarDataFromVin } from "../utils/operator";

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
      <div className="flex gap-2 items-center mb-4">
        <input
          type="text"
          placeholder="Enter VIN"
          value={formData.vin}
          onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          className="flex-1 border p-2 rounded"
        />
        <button
          onClick={handleVinLookup}
          className="bg-blue-600 text-white px-4 py-2 rounded"
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
