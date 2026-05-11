import React from "react";
import ItemForm from "../../../components/shared/ItemForm";
import kidsSchema from "../kidsSchema";

function KidsForm({ formData, setFormData, onSubmit, onCancel }) {
  return (
    <ItemForm
      schema={kidsSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      title="Log a Milestone"
      buttonText="Milestone"
    />
  );
}

export default KidsForm;
