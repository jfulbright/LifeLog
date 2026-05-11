import React from "react";
import ItemForm from "../../../components/shared/ItemForm";
import { useAppData } from "../../../contexts/AppDataContext";
import kidsSchema from "../kidsSchema";

function KidsForm({ formData, setFormData, onSubmit, onCancel }) {
  const { contacts } = useAppData();

  const wrappedSetFormData = (updater) => {
    setFormData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      if (next.childContactId && next.childContactId !== prev.childContactId) {
        const child = contacts.find((c) => c.id === next.childContactId);
        if (child) {
          next.companions = [{ type: "contact", contactId: child.id, displayName: child.displayName }];
          next.shareWithCompanionIds = [child.id];
        }
      }
      return next;
    });
  };

  return (
    <ItemForm
      schema={kidsSchema}
      formData={formData}
      setFormData={wrappedSetFormData}
      onSubmit={onSubmit}
      onCancel={onCancel}
      title="Log a Milestone"
      buttonText="Milestone"
    />
  );
}

export default KidsForm;
