import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { getCategoryMeta, getEntryTitle } from "../../helpers/categoryMeta";
import { useAppData } from "../../contexts/AppDataContext";
import { useViewerMode } from "../../contexts/ViewerModeContext";
import collaboratorService from "../../services/collaboratorService";
import ItemForm from "./ItemForm";
import EntryHeader from "./EntryHeader";
import EntryView from "./EntryView";
import ReadOnlySocialSection from "./ReadOnlySocialSection";
import ConfirmHideModal from "./ConfirmHideModal";

function EntryDetailPanel({ item, category, schema, onClose, onSave, onDelete, onLeave, readOnly = false, renderItemExtras, renderCustomView, headerExtra }) {
  // Viewing another user's category page → force read-only regardless of props.
  const viewerUserId = useViewerMode();
  readOnly = readOnly || !!viewerUserId;
  const [mode, setMode] = useState("view");
  const [formData, setFormData] = useState({ ...item });
  const [showLeave, setShowLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { contacts } = useAppData();

  // Hydrate the share toggle from the collaborators table when editing an owned
  // entry, mirroring useCategory.startEditing. Without this the detail-panel edit
  // form always rendered the "Share & Collaborate" toggle as off, even for
  // companions who are live collaborators (and on save would have wiped the share).
  useEffect(() => {
    if (!item?.id || item._isShared) return;
    let cancelled = false;
    (async () => {
      try {
        const collabs = await collaboratorService.getCollaboratorsForOwnedEntry(item.id);
        const shared = collabs.filter((c) => c.collaborator_contact_id);
        if (cancelled || shared.length === 0) return;
        const sharedContactIds = shared.map((c) => c.collaborator_contact_id);
        const collaboratorStatuses = Object.fromEntries(
          shared.map((c) => [c.collaborator_contact_id, c.status])
        );
        setFormData((prev) => ({
          ...prev,
          shareWithCompanionIds: sharedContactIds,
          // collaborate ⟹ visible: surface existing collaborators under
          // "Who can see this" even on entries saved before that field existed.
          visibilityContacts: Array.from(
            new Set([...(prev.visibilityContacts || []), ...sharedContactIds])
          ),
          _collaboratorStatuses: collaboratorStatuses,
        }));
      } catch {
        /* visibility still resolves at read time; toggle hydration is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item?.id, item?._isShared]);

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

  // Leave a shared entry (E2) — soft-hide via B3's revoked_at, never a delete.
  const handleLeave = async () => {
    setLeaving(true);
    try {
      await collaboratorService.leaveSharedEntry(item.id);
      if (onLeave) onLeave(item.id);
      onClose();
    } catch (err) {
      console.error("[EntryDetailPanel] leave failed:", err);
    } finally {
      setLeaving(false);
      setShowLeave(false);
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
    <>
    <Modal show={true} onHide={onClose} centered size="xl" dialogClassName="entry-detail-modal">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
          <span aria-hidden="true" style={{ marginRight: "0.5rem" }}>{meta.icon}</span>
          {mode === "edit" ? `Edit ${getEntryTitle(category, item)}` : getEntryTitle(category, item)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: "1.25rem" }}>
        {mode === "view" ? (
          renderCustomView ? (
            renderCustomView({ item, onEdit: readOnly ? undefined : () => setMode("edit"), onDelete: readOnly || item._isShared ? undefined : handleDelete, onLeave: !readOnly && item._isShared ? () => setShowLeave(true) : undefined, onClose })
          ) : (
            <>
              <EntryHeader
                item={item}
                category={category}
                schema={schema}
                contacts={contacts}
              />
              {headerExtra && (
                <div style={{ marginTop: "0.5rem" }}>{headerExtra(item)}</div>
              )}
              <div style={{ marginTop: "1rem" }}>
                <EntryView
                  item={item}
                  category={category}
                  schema={schema}
                  contacts={contacts}
                  headerFieldNames={headerFieldNames}
                  onEdit={readOnly ? undefined : () => setMode("edit")}
                  onDelete={readOnly || item._isShared ? undefined : handleDelete}
                  onLeave={!readOnly && item._isShared ? () => setShowLeave(true) : undefined}
                  renderItemExtras={renderItemExtras}
                  expanded
                />
              </div>
            </>
          )
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
    <ConfirmHideModal
      show={showLeave}
      onConfirm={handleLeave}
      onCancel={() => setShowLeave(false)}
      busy={leaving}
      title="Leave this shared entry?"
      body={
        <>
          It'll be <strong style={{ color: "var(--color-text-primary)" }}>hidden from your timeline</strong> —
          not deleted. The owner keeps it, and it comes back if you reconnect.
        </>
      }
      confirmLabel="Leave"
      busyLabel="Leaving…"
    />
    </>
  );
}

export default EntryDetailPanel;
