import React from "react";
import ItemForm from "../../../components/shared/ItemForm";
import movieSchema from "../movieSchema";

function MovieForm({ formData, setFormData, onSubmit, onCancel }) {
  return (
    <ItemForm
      schema={movieSchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      title="Movie"
      buttonText="Save Movie"
    />
  );
}

export default MovieForm;
