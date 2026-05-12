import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { isFieldVisible, getItemPhotos } from "../../helpers/operator";
import { RING_META } from "../../helpers/ringMeta";
import dataService from "../../services/dataService";
import overlayService from "../../services/overlayService";
import PhotoGrid from "./PhotoGrid";

function CompanionsDisplay({ companions, contacts }) {
  if (!Array.isArray(companions) || companions.length === 0) return null;
  return (
    <span>
      {companions.map((entry, i) => {
        if (typeof entry === "string") {
          return (
            <span key={i}>
              {i > 0 ? ", " : ""}
              {entry}
            </span>
          );
        }
        if (entry.type === "contact") {
          const contact = contacts.find((c) => c.id === entry.contactId);
          const ring = contact ? RING_META[contact.ringLevel] : null;
          return (
            <span key={i}>
              {i > 0 ? ", " : ""}
              <span
                style={{
                  background: ring ? ring.bgColor : "var(--color-surface-hover)",
                  border: `1px solid ${ring ? ring.borderColor : "var(--color-border)"}`,
                  borderRadius: 10,
                  padding: "0.05rem 0.4rem",
                  fontSize: "0.85em",
                  color: ring ? ring.color : "var(--color-text-primary)",
                  fontWeight: 600,
                }}
              >
                {ring ? ring.emoji + " " : ""}
                {entry.displayName}
              </span>
            </span>
          );
        }
        return (
          <span key={i}>
            {i > 0 ? ", " : ""}
            {entry.name}
          </span>
        );
      })}
    </span>
  );
}

function SharingInfo({ item, contacts, navigate }) {
  const rings = item.visibilityRings || [];
  const taggedIds = item.taggedContactIds || [];
  const sharedIds = item.shareWithCompanionIds || [];
  if (rings.length === 0 && taggedIds.length === 0 && sharedIds.length === 0) return null;

  const ringLabels = rings.map((r) => RING_META[r]).filter(Boolean);
  const taggedContacts = taggedIds
    .map((id) => contacts.find((c) => c.id === id))
    .filter(Boolean);
  const sharedContacts = sharedIds
    .map((id) => contacts.find((c) => c.id === id))
    .filter(Boolean);

  const pillClick = navigate ? () => navigate("/people") : undefined;
  const pillStyle = navigate ? { cursor: "pointer" } : {};

  return (
    <div
      style={{
        marginTop: "0.75rem",
        padding: "0.625rem 0.75rem",
        background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
        borderRadius: 6,
        border: "1px solid var(--color-border)",
        fontSize: "var(--font-size-xs)",
      }}
    >
      {sharedContacts.length > 0 && (
        <div style={{ marginBottom: ringLabels.length > 0 ? "0.5rem" : 0 }}>
          <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🤝 Shared experience with
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {sharedContacts.map((c) => {
              const ring = RING_META[c.ringLevel];
              return (
                <span
                  key={c.id}
                  onClick={pillClick}
                  style={{
                    background: ring ? ring.bgColor : "var(--color-surface-hover)",
                    border: `1px solid ${ring ? ring.borderColor : "var(--color-border)"}`,
                    borderRadius: 10,
                    padding: "0.1rem 0.5rem",
                    color: ring ? ring.color : "var(--color-text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    ...pillStyle,
                  }}
                >
                  {ring ? ring.emoji + " " : ""}{c.displayName}
                </span>
              );
            })}
          </div>
        </div>
      )}
      {(ringLabels.length > 0 || taggedContacts.length > 0) && (
        <div>
          <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            👁 Who can see this
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {ringLabels.map((ring) => (
              <span
                key={ring.label}
                onClick={pillClick}
                style={{
                  background: ring.bgColor,
                  border: `1px solid ${ring.borderColor}`,
                  borderRadius: 10,
                  padding: "0.1rem 0.5rem",
                  color: ring.color,
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  ...pillStyle,
                }}
              >
                {ring.emoji} {ring.label}
              </span>
            ))}
            {taggedContacts.map((c) => {
              const ring = RING_META[c.ringLevel];
              return (
                <span
                  key={c.id}
                  onClick={pillClick}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 10,
                    padding: "0.1rem 0.5rem",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    ...pillStyle,
                  }}
                >
                  {ring ? ring.emoji : ""} {c.displayName}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CoParticipantOverlays({ itemId, contacts }) {
  const [overlays, setOverlays] = useState([]);

  useEffect(() => {
    dataService.getOverlaysForEntry(itemId).then(setOverlays);
  }, [itemId]);

  const overlaysWithContent = overlays.filter((o) => {
    const hasSnaps = [o.snapshot1, o.snapshot2, o.snapshot3].some(Boolean);
    const hasPhotos = [o.photo1, o.photo2, o.photo3].some(Boolean);
    return hasSnaps || hasPhotos || o.rating;
  });

  if (overlaysWithContent.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "0.75rem",
        paddingTop: "0.75rem",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "var(--font-size-xs)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--color-text-secondary)",
          marginBottom: "0.625rem",
        }}
      >
        👥 What others captured
      </div>
      {overlaysWithContent.map((overlay) => {
        const contact = contacts.find((c) => c.id === overlay.contactId);
        const snaps = [overlay.snapshot1, overlay.snapshot2, overlay.snapshot3].filter(Boolean);
        const photos = [overlay.photo1, overlay.photo2, overlay.photo3].filter(Boolean);
        return (
          <div
            key={overlay.id}
            style={{
              marginBottom: "0.75rem",
              paddingLeft: "0.75rem",
              borderLeft: "2px solid var(--color-border)",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-secondary)",
                marginBottom: "0.375rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {contact ? contact.displayName : "Someone"}
              {overlay.rating && (
                <span style={{ color: "#f5a623", letterSpacing: "0.05em" }}>
                  {"★".repeat(parseInt(overlay.rating))}
                  {"☆".repeat(5 - parseInt(overlay.rating))}
                </span>
              )}
            </div>
            {snaps.map((snap, i) => (
              <div
                key={i}
                style={{
                  fontStyle: "italic",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.2rem",
                }}
              >
                &ldquo;{snap}&rdquo;
              </div>
            ))}
            {photos.length > 0 && (
              <div style={{ marginTop: "0.375rem" }}>
                <PhotoGrid photos={photos} height={100} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SharedOverlayForm({ itemId, itemStatus }) {
  const [overlay, setOverlay] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isWishlist = itemStatus === "wishlist";

  useEffect(() => {
    overlayService.getMyOverlay(itemId).then((o) => {
      if (o) setOverlay(o);
    }).catch(() => {});
  }, [itemId]);

  const [snap1, setSnap1] = useState("");
  const [snap2, setSnap2] = useState("");
  const [snap3, setSnap3] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (overlay) {
      setSnap1(overlay.snapshot1 || "");
      setSnap2(overlay.snapshot2 || "");
      setSnap3(overlay.snapshot3 || "");
      setNotes(overlay.notes || "");
    }
  }, [overlay]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await overlayService.saveOverlay(itemId, {
        snapshot1: isWishlist ? notes : snap1,
        snapshot2: snap2,
        snapshot3: snap3,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("[SharedOverlayForm] save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const hasContent = isWishlist ? notes : (snap1 || snap2 || snap3);

  return (
    <div style={{
      marginTop: "0.75rem",
      padding: "0.75rem",
      background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
      borderRadius: 8,
      border: "1px solid var(--color-border)",
    }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: "var(--font-size-sm)",
          color: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        {isWishlist ? "💭 Add your thoughts" : "✨ Add your memories"}
        {hasContent && !expanded && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", fontWeight: 600 }}>
            (saved)
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: "0.75rem" }}>
          {isWishlist ? (
            <Form.Group>
              <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                Why I'm interested
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                maxLength={280}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What excites you about this?"
                style={{ fontSize: "var(--font-size-sm)" }}
              />
            </Form.Group>
          ) : (
            <>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                  Snap 1
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  maxLength={140}
                  value={snap1}
                  onChange={(e) => setSnap1(e.target.value)}
                  placeholder="A quick memory..."
                  style={{ fontSize: "var(--font-size-sm)" }}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                  Snap 2
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  maxLength={140}
                  value={snap2}
                  onChange={(e) => setSnap2(e.target.value)}
                  placeholder="A small detail..."
                  style={{ fontSize: "var(--font-size-sm)" }}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                  Snap 3
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  maxLength={140}
                  value={snap3}
                  onChange={(e) => setSnap3(e.target.value)}
                  placeholder="How it made you feel..."
                  style={{ fontSize: "var(--font-size-sm)" }}
                />
              </Form.Group>
            </>
          )}
          <div className="d-flex align-items-center gap-2 mt-2">
            <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            {saved && (
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", fontWeight: 600 }}>
                Saved!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemDetailContent({
  item,
  category,
  schema,
  contacts,
  headerFieldNames,
  onEdit,
  onDelete,
  renderItemExtras,
}) {
  const navigate = useNavigate();
  const itemId = item.id;

  return (
    <>
      {schema.map((field) => {
        if (field.hidden || !isFieldVisible(field, item)) return null;
        if (headerFieldNames.has(field.name)) return null;
        if (field.type === "photo") return null;

        const value = item[field.name];
        if (!value || (Array.isArray(value) && value.length === 0)) return null;

        if (field.renderAs === "stars") {
          const numVal = parseInt(value, 10) || 0;
          return (
            <div key={field.name} className="item-card-detail-row">
              <div className="item-card-detail-label">{field.label}</div>
              <div className="item-card-detail-value" style={{ color: "#f5a623", letterSpacing: "0.1em" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s}>{s <= numVal ? "\u2605" : "\u2606"}</span>
                ))}
              </div>
            </div>
          );
        }

        if (/^snapshot\d$/.test(field.name) && typeof value === "string") {
          return (
            <div
              key={field.name}
              className="item-card-snapshot"
              style={{
                marginBottom: "0.5rem",
                fontStyle: "italic",
                fontSize: "var(--font-size-sm, 0.875rem)",
                color: "var(--text-secondary, #6c757d)",
              }}
            >
              &#10024; {value}
            </div>
          );
        }

        return (
          <div key={field.name} className="item-card-detail-row">
            <div className="item-card-detail-label">
              {field.label}
            </div>
            <div className="item-card-detail-value">
              {field.isLink && typeof value === "string" ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View link
                </a>
              ) : field.name === "companions" && Array.isArray(value) ? (
                <CompanionsDisplay companions={value} contacts={contacts} />
              ) : Array.isArray(value) ? (
                <ol className="mb-0 ps-3" style={{ fontSize: "var(--font-size-sm)" }}>
                  {value.map((v, i) => (
                    <li key={i}>{typeof v === "string" ? v : v.name || v.displayName || JSON.stringify(v)}</li>
                  ))}
                </ol>
              ) : (
                value
              )}
            </div>
          </div>
        );
      })}

      {getItemPhotos(item).length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <PhotoGrid photos={getItemPhotos(item)} height={140} />
        </div>
      )}

      <SharingInfo item={item} contacts={contacts} navigate={navigate} />
      <CoParticipantOverlays itemId={itemId} contacts={contacts} />

      {item._isShared && (
        <SharedOverlayForm itemId={itemId} itemStatus={item.status} />
      )}

      {renderItemExtras && renderItemExtras(item)}

      {(onEdit || onDelete) && (
        <div className="mt-3 d-flex gap-2">
          {onEdit && !item._isShared && (
            <Button
              size="sm"
              variant="outline-primary"
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
          {onDelete && !item._isShared && (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default ItemDetailContent;
