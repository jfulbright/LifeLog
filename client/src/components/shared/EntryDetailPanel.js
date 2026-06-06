import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { getCategoryMeta } from "../../helpers/categoryMeta";
import { useAppData } from "../../contexts/AppDataContext";
import ItemForm from "./ItemForm";
import EntryHeader from "./EntryHeader";
import EntryView from "./EntryView";
import ReadOnlySocialSection from "./ReadOnlySocialSection";

function EntryDetailPanel({ item, category, schema, onClose, onSave, onDelete, renderItemExtras }) {
  const [mode, setMode] = useState("view");
  const [formData, setFormData] = useState({ ...item });
  const { contacts } = useAppData();

  if (!item) return null;

  const meta = getCategoryMeta(category);

  const handleSave = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (onSave) onSave(formData);
    setMode("view");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      if (onDelete) onDelete(item.id);
      onClose();
    }
  };

  const headerFieldNames = new Set([
    meta.primaryField,
    ...(meta.secondaryFields || []),
    meta.dateField,
    "status",
    "endDate",
    ...(meta.extraHandledFields || []),
  ]);

  return (
    <Modal show={true} onHide={onClose} centered size="xl" dialogClassName="entry-detail-modal">
      <Modal.Body style={{ maxHeight: "85vh", overflowY: "auto", padding: "1.25rem" }}>
        {mode === "view" ? (
          <>
            <EntryHeader
              item={item}
              category={category}
              schema={schema}
              contacts={contacts}
            />
            <div style={{ marginTop: "1rem" }}>
              <EntryView
                item={item}
                category={category}
                schema={schema}
                contacts={contacts}
                headerFieldNames={headerFieldNames}
                onEdit={() => setMode("edit")}
                onDelete={!item._isShared ? handleDelete : undefined}
                renderItemExtras={renderItemExtras}
                expanded
              />
            </div>
          </>
        ) : (
          <>
            {item._isShared && (
              <>
                <div style={{
                  background: "var(--color-surface, #f0f7ff)",
                  border: "1px solid var(--color-border, #e0e0e0)",
                  borderRadius: 8,
                  padding: "0.5rem 0.75rem",
                  marginBottom: "1rem",
                  fontSize: "var(--font-size-sm, 0.85rem)",
                  color: "var(--color-text-secondary, #696969)",
                }}>
                  Editing shared entry — changes are visible to all collaborators
                </div>
                <ReadOnlySocialSection item={item} contacts={contacts} />
              </>
            )}
            <ItemForm
              schema={schema}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSave}
              onCancel={() => setMode("view")}
              title=""
              buttonText={category.charAt(0).toUpperCase() + category.slice(1)}
              hideSections={item._isShared ? ["Social", "Snapshots", "Photos"] : undefined}
            />
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default EntryDetailPanel;
