import React, { useState } from "react";
import { Badge, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { isFieldVisible } from "../../helpers/operator";
import { RING_META } from "../../helpers/ringMeta";
import { getCategoryMeta } from "../../helpers/categoryMeta";
import { getStatusLabel } from "../../helpers/statusLabels";
import PhotoGrid from "./PhotoGrid";
import SharedMemoriesSection from "./SharedMemoriesSection";

const SOCIAL_FIELD_NAMES = new Set(["companions", "visibilityControl", "recommendation"]);

const EVENT_TYPE_EMOJI = {
  concert: "🎵",
  sports: "🏟️",
  broadway: "🎭",
  comedy: "🎤",
  festival: "🎪",
  other: "📅",
};

function getSubTypeDisplay(item, schema) {
  const typeValue = item.eventType || item.subType || item.activityType;
  if (!typeValue) return null;

  const typeField = schema.find(
    (f) => f.name === "eventType" || f.name === "subType" || f.name === "activityType"
  );
  const label = typeField?.optionLabels?.[typeValue]
    || typeValue.charAt(0).toUpperCase() + typeValue.slice(1);
  const emoji = EVENT_TYPE_EMOJI[typeValue] || null;
  return { emoji, label };
}

function PeoplePills({ people, contacts }) {
  if (!Array.isArray(people) || people.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
      {people.map((entry, i) => {
        if (typeof entry === "string") {
          return (
            <span key={i} style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {entry}
            </span>
          );
        }
        if (entry.type === "contact") {
          const contact = contacts.find((c) => c.id === entry.contactId);
          const ring = contact ? RING_META[contact.ringLevel] : null;
          return (
            <span
              key={i}
              style={{
                background: ring ? ring.bgColor : "var(--color-surface-hover)",
                border: `1px solid ${ring ? ring.borderColor : "var(--color-border)"}`,
                borderRadius: 10,
                padding: "0.1rem 0.5rem",
                fontSize: "0.75rem",
                color: ring ? ring.color : "var(--color-text-primary)",
                fontWeight: 600,
              }}
            >
              {ring ? ring.emoji + " " : ""}{entry.displayName}
            </span>
          );
        }
        return (
          <span key={i} style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", fontWeight: 600 }}>
            {entry.name}
          </span>
        );
      })}
    </div>
  );
}

function ContactPills({ contactIds, contacts }) {
  if (!Array.isArray(contactIds) || contactIds.length === 0) return null;
  const resolved = contactIds.map((id) => contacts.find((c) => c.id === id)).filter(Boolean);
  if (resolved.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
      {resolved.map((c) => {
        const ring = RING_META[c.ringLevel];
        return (
          <span
            key={c.id}
            style={{
              background: ring ? ring.bgColor : "var(--color-surface-hover)",
              border: `1px solid ${ring ? ring.borderColor : "var(--color-border)"}`,
              borderRadius: 10,
              padding: "0.1rem 0.5rem",
              fontSize: "0.75rem",
              color: ring ? ring.color : "var(--color-text-secondary)",
              fontWeight: 600,
            }}
          >
            {ring ? ring.emoji + " " : ""}{c.displayName}
          </span>
        );
      })}
    </div>
  );
}

function SharingInfo({ item, contacts, navigate }) {
  const rings = item.visibilityRings || [];
  const taggedIds = item.taggedContactIds || [];
  if (rings.length === 0 && taggedIds.length === 0) return null;

  const ringLabels = rings.map((r) => RING_META[r]).filter(Boolean);
  const taggedContacts = taggedIds.map((id) => contacts.find((c) => c.id === id)).filter(Boolean);
  if (ringLabels.length === 0 && taggedContacts.length === 0) return null;

  const pillClick = navigate ? () => navigate("/people") : undefined;
  const pillStyle = navigate ? { cursor: "pointer" } : {};

  return (
    <div style={{ marginBottom: "0.5rem" }}>
      <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
        {"🔒"} Who can see this
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {ringLabels.map((ring) => (
          <span key={ring.label} onClick={pillClick} style={{
            background: ring.bgColor,
            border: `1px solid ${ring.borderColor}`,
            borderRadius: 10,
            padding: "0.1rem 0.5rem",
            color: ring.color,
            fontWeight: 700,
            fontSize: "0.7rem",
            ...pillStyle,
          }}>
            {ring.emoji} {ring.label}
          </span>
        ))}
        {taggedContacts.map((c) => {
          const ring = RING_META[c.ringLevel];
          return (
            <span key={c.id} onClick={pillClick} style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "0.1rem 0.5rem",
              color: "var(--color-text-secondary)",
              fontWeight: 600,
              fontSize: "0.7rem",
              ...pillStyle,
            }}>
              {ring ? ring.emoji : ""} {c.displayName}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function FullDetailModalBody({ item, category, schema, contacts, navigate, onEdit, onDelete }) {
  const meta = getCategoryMeta(category);
  const subType = getSubTypeDisplay(item, schema);
  const companions = item.companions;
  const sharedIds = item.shareWithCompanionIds || [];
  const hasCompanions = Array.isArray(companions) && companions.length > 0;
  const hasShared = sharedIds.length > 0;

  const photos = [item.photo1, item.photo2, item.photo3].filter(Boolean);
  const snaps = [item.snapshot1, item.snapshot2, item.snapshot3].filter(Boolean);
  const rating = item.rating ? parseInt(item.rating, 10) : 0;

  const allDetailFields = schema.filter((field) => {
    if (field.hidden || !isFieldVisible(field, item)) return false;
    if (field.type === "photo") return false;
    if (field.renderAs === "stars") return false;
    if (/^snapshot\d$/.test(field.name)) return false;
    if (field.name === "title") return false;
    if (field.name === "eventType" || field.name === "subType" || field.name === "activityType") return false;
    if (SOCIAL_FIELD_NAMES.has(field.name)) return false;
    const value = item[field.name];
    if (!value || (Array.isArray(value) && value.length === 0)) return false;
    return true;
  });

  const secondaryText = meta.secondaryFields?.map((f) => item[f]).filter(Boolean).join(", ");

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        {subType && (
          <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
            {subType.emoji || meta.icon} {subType.label}
          </div>
        )}
        {secondaryText && (
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            {secondaryText}
          </div>
        )}
        {item[meta.dateField] && (
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>
            {"📅"} {new Date(item[meta.dateField] + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {item.endDate && item.endDate !== item[meta.dateField] && ` – ${new Date(item.endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </div>
        )}
        {item.status && (
          <Badge bg="secondary" style={{ marginTop: "0.375rem", fontSize: "0.65rem" }}>
            {getStatusLabel(category, item.status)}
          </Badge>
        )}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <PhotoGrid photos={photos} height={180} />
        </div>
      )}

      {/* Rating */}
      {rating > 0 && (
        <div style={{ marginBottom: "0.75rem", fontSize: "1.25rem", color: "#f5a623", letterSpacing: "0.02em" }}>
          {"★".repeat(rating)}{"☆".repeat(5 - rating)}
        </div>
      )}

      {/* Snapshots */}
      {snaps.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          {snaps.map((snap, i) => (
            <div key={i} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
              {"✨"} {snap}
            </div>
          ))}
        </div>
      )}

      {/* All detail fields */}
      {allDetailFields.length > 0 && (
        <div style={{ marginBottom: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
          {allDetailFields.map((field) => {
            const value = item[field.name];
            return (
              <div key={field.name} className="item-card-detail-row">
                <div className="item-card-detail-label">{field.label}</div>
                <div className="item-card-detail-value">
                  {field.isLink && typeof value === "string" ? (
                    <a href={value} target="_blank" rel="noopener noreferrer">View link</a>
                  ) : Array.isArray(value) ? (
                    value.join(", ")
                  ) : (
                    value
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Social: companions, collaborators, visibility */}
      {hasCompanions && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
            {"👥"} Who was there?
          </div>
          <PeoplePills people={companions} contacts={contacts} />
        </div>
      )}

      {hasShared && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
            {"🤝"} Shared Collaborators
          </div>
          <ContactPills contactIds={sharedIds} contacts={contacts} />
        </div>
      )}

      <SharingInfo item={item} contacts={contacts} navigate={navigate} />

      {/* Shared Memories */}
      <SharedMemoriesSection item={item} contacts={contacts} />

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="mt-3 d-flex gap-2" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
          {onEdit && !item._isShared && (
            <Button size="sm" variant="outline-primary" onClick={onEdit}>Edit</Button>
          )}
          {onDelete && !item._isShared && (
            <Button size="sm" variant="outline-danger" onClick={onDelete}>Delete</Button>
          )}
        </div>
      )}
    </div>
  );
}

function ItemDetailsSection({
  item,
  category,
  schema,
  contacts,
  headerFieldNames,
  onEdit,
  onDelete,
  renderItemExtras,
  inline = false,
}) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showInline, setShowInline] = useState(false);
  const meta = getCategoryMeta(category);

  const allFields = schema.filter((field) => {
    if (field.hidden || !isFieldVisible(field, item)) return false;
    if (headerFieldNames.has(field.name)) return false;
    if (field.type === "photo") return false;
    if (field.renderAs === "stars") return false;
    if (/^snapshot\d$/.test(field.name)) return false;
    if (field.name === "title") return false;
    if (field.name === "eventType" || field.name === "subType" || field.name === "activityType") return false;
    const value = item[field.name];
    if (!value || (Array.isArray(value) && value.length === 0)) return false;
    return true;
  });

  const summaryFields = allFields.filter((f) => f.section === "Details");
  const subType = getSubTypeDisplay(item, schema);

  const noContent = summaryFields.length === 0 && !subType;
  if (noContent) return null;

  return (
    <div>
      {/* Zone 1: Always visible — subtype + summary fields */}
      {subType && (
        <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.375rem", marginTop: "0.5rem" }}>
          {subType.emoji || meta.icon} {subType.label}
        </div>
      )}

      {summaryFields.map((field) => {
        const value = item[field.name];
        return (
          <div key={field.name} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.25rem" }}>
            {field.isLink && typeof value === "string" ? (
              <a href={value} target="_blank" rel="noopener noreferrer">View link</a>
            ) : Array.isArray(value) ? (
              value.join(", ")
            ) : (
              value
            )}
          </div>
        );
      })}

      {renderItemExtras && renderItemExtras(item)}

      {/* Show Details link */}
      {inline ? (
        <>
          <button
            type="button"
            onClick={() => setShowInline(!showInline)}
            style={{
              background: "none",
              border: "none",
              padding: "0.5rem 0",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {showInline ? "Hide Details" : "Show Details"}
            <span style={{ fontSize: "var(--font-size-xs)" }}>{showInline ? "▲" : "▼"}</span>
          </button>
          {showInline && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
              <FullDetailModalBody
                item={item}
                category={category}
                schema={schema}
                contacts={contacts}
                navigate={navigate}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              background: "none",
              border: "none",
              padding: "0.5rem 0",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            Show Details
            <span style={{ fontSize: "var(--font-size-xs)" }}>{"→"}</span>
          </button>

          <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title style={{ fontFamily: "var(--font-display)", fontSize: "var(--font-size-lg)", fontWeight: 700 }}>
                <span style={{ marginRight: "0.5rem" }}>{meta.icon}</span>
                {meta.getPrimaryDisplay ? meta.getPrimaryDisplay(item) || "Details" : item[meta.primaryField] || "Details"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: "80vh", overflowY: "auto" }}>
              <FullDetailModalBody
                item={item}
                category={category}
                schema={schema}
                contacts={contacts}
                navigate={navigate}
                onEdit={() => { setShowModal(false); if (onEdit) onEdit(); }}
                onDelete={() => { setShowModal(false); if (onDelete) onDelete(); }}
              />
            </Modal.Body>
          </Modal>
        </>
      )}
    </div>
  );
}

export default ItemDetailsSection;
