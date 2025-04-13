// client/src/features/travel/TravelForm.js

import React from "react";
import ItemForm from "components/shared/ItemForm";
import travelSchema from "features/travel/travelSchema";

/**
 * TravelForm uses the shared ItemForm component.
 * Keeps UI and logic consistent with other forms.
 */
function TravelForm({ formData, setFormData, onSubmit }) {
  return (
    <ItemForm
      schema={travelSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      title="Add a Trip"
      buttonText="Add Trip"
    />
  );
}

export default TravelForm;
