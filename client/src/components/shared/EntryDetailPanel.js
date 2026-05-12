import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { getCategoryMeta } from "../../helpers/categoryMeta";
import { useAppData } from "../../contexts/AppDataContext";
import ItemForm from "./ItemForm";
import ItemDetailContent from "./ItemDetailContent";

function EntryDetailPanel({ item, category, schema, onClose, onSave, onDelete, renderItemExtras }) {
  const [mode, setMode] = useState("view");
  const [formData, setFormData] = useState({ ...item });
  const { contacts } = useAppData();

  if (!item) return null;

  const meta = getCategoryMeta(category);

  const getPrimaryLabel = () => {
    if (meta.getPrimaryDisplay) return meta.getPrimaryDisplay(item) || "Untitled";
    return item[meta.primaryField] || item.artist || item.title || item.type || item.make || "Untitled";
  };

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
  ]);

  const title = getPrimaryLabel();
  const panelTitle = mode === "edit" ? `Edit — ${title}` : title;

  return (
    <Modal show={true} onHide={onClose} centered size="xl" dialogClassName="entry-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontWeight: 600 }}>
          <span style={{ marginRight: "0.5rem" }}>{meta.icon}</span>
          {panelTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "80vh", overflowY: "auto" }}>
      {mode === "view" ? (
        <ItemDetailContent
          item={item}
          category={category}
          schema={schema}
          contacts={contacts}
          headerFieldNames={headerFieldNames}
          onEdit={!item._isShared ? () => setMode("edit") : undefined}
          onDelete={!item._isShared ? handleDelete : undefined}
          renderItemExtras={renderItemExtras}
        />
      ) : (
        <ItemForm
          schema={schema}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSave}
          onCancel={() => setMode("view")}
          title=""
          buttonText={category.charAt(0).toUpperCase() + category.slice(1)}
        />
      )}
      </Modal.Body>
    </Modal>
  );
}

export default EntryDetailPanel;
