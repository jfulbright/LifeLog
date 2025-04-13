import React from "react";
import ItemForm from "components/shared/ItemForm";
import homeSchema from "features/homes/homeSchema";

/**
 * HomeForm uses the shared ItemForm component.
 * Keeps UI and logic consistent with other forms.
 */
function HomeForm({ formData, setFormData, onSubmit }) {
  return (
    <ItemForm
      schema={homeSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      title="Add a Home"
      buttonText="Add Home"
    />
  );
}

export default HomeForm;
