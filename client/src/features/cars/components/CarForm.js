import React, { useState } from "react";
import { Spinner, Alert } from "react-bootstrap";
import ItemForm from "../../../components/shared/ItemForm";
import carSchema from "../../../features/cars/carSchema";
import { fetchCarDataFromVin, isValidVin } from "../../../features/cars/api/carApi";

function CarForm({ formData, setFormData, onSubmit }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVinLookup = async () => {
    const vin = (formData.vin || "").trim();
    if (!vin) {
      setError("Please enter a VIN.");
      return;
    }
    if (!isValidVin(vin)) {
      setError("VIN must be exactly 17 alphanumeric characters (no I, O, or Q).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const vinData = await fetchCarDataFromVin(vin);
      setFormData((prev) => ({ ...prev, ...vinData }));
    } catch (err) {
      setError("VIN lookup failed. Please check the VIN and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="d-flex gap-2 align-items-center mb-3">
        <input
          type="text"
          placeholder="e.g. 1HGCM82633A004352"
          maxLength={17}
          value={formData.vin || ""}
          onChange={(e) =>
            setFormData({ ...formData, vin: e.target.value.toUpperCase() })
          }
          className="form-control"
        />
        <button
          onClick={handleVinLookup}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : "Lookup"}
        </button>
      </div>

      {error && (
        <Alert variant="warning" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      <ItemForm
        schema={carSchema}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        title="Add a Car"
        buttonText="Car"
      />
    </>
  );
}

export default CarForm;
