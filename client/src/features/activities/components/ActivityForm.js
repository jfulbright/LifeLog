import React from "react";
import ItemForm from "../../../components/shared/ItemForm";
import activitySchema from "../activitySchema";

function ActivityForm({ formData, setFormData, onSubmit, onCancel }) {
  return (
    <ItemForm
      schema={activitySchema}
      formData={formData}
      setFormData={setFormData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      title="Add an Activity"
      buttonText="Activity"
      hideSections={formData?._isShared ? ["Social", "Snapshots", "Photos"] : undefined}
    />
  );
}

export default ActivityForm;
