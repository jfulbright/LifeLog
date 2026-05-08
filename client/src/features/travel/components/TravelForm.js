// client/src/features/travel/TravelForm.js

import React from "react";
import ItemForm from "../../../components/shared/ItemForm";
import travelSchema from "../../../features/travel/travelSchema";

/**
 * Wrapper for the shared ItemForm.
 * Passes travel-specific schema and custom form title/button text.
 */
function TravelForm({ formData, setFormData, onSubmit, onCancel }) {
  return (
    <ItemForm
      schema={travelSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      title="Add a Trip"
      buttonText="Trip"
    />
  );
}

export default TravelForm;
