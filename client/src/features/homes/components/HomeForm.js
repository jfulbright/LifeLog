// client/src/features/homes/components/HomeForm.jsx

import React from "react";
import ItemForm from "components/shared/ItemForm";
import homeSchema from "features/homes/homeSchema";

/**
 * Wrapper around ItemForm using the home-specific schema.
 */
function HomeForm({ formData, setFormData, onSubmit }) {
  return (
    <ItemForm
      schema={homeSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      title="Add Home"
      buttonText="Save Home"
    />
  );
}

export default HomeForm;
