import React from "react";
import ItemForm from "../../../components/shared/ItemForm";
import wineSchema from "../wineSchema";

function WineForm({ formData, setFormData, onSubmit, onCancel }) {
  return (
    <ItemForm
      schema={wineSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      title="Add a Wine"
      buttonText="Wine"
    />
  );
}

export default WineForm;
