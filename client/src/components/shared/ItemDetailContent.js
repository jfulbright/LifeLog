import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { isFieldVisible } from "../../helpers/operator";
import { RING_META } from "../../helpers/ringMeta";
import overlayService from "../../services/overlayService";
import { useSocialData } from "../../contexts/SocialDataContext";
import PhotoUploadField from "./PhotoUploadField";
import SocialMemoriesCard from "./SocialMemoriesCard";

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

function SocialMemoriesSection({ item, contacts, refreshKey }) {
  return <SocialMemoriesCard item={item} contacts={contacts} refreshKey={refreshKey} />;
}

function SharedOverlayForm({ itemId, onSaved }) {
  const [overlay, setOverlay] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    overlayService.getMyOverlay(itemId).then((o) => {
      if (o) setOverlay(o);
    }).catch(() => {});
  }, [itemId]);

  const [snap1, setSnap1] = useState("");
  const [snap2, setSnap2] = useState("");
  const [snap3, setSnap3] = useState("");
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState("");
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (overlay) {
      setSnap1(overlay.snapshot1 || "");
      setSnap2(overlay.snapshot2 || "");
      setSnap3(overlay.snapshot3 || "");
      setNotes(overlay.why_notes || "");
      setRating(overlay.rating ? String(overlay.rating) : "");
      setPhotos(Array.isArray(overlay.photos) ? overlay.photos.filter(Boolean) : []);
    }
  }, [overlay]);

  const setPhotoAt = (index, url) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const savedOverlay = await overlayService.saveOverlay(itemId, {
        why_notes: notes,
        snapshot1: snap1,
        snapshot2: snap2,
        snapshot3: snap3,
        rating: rating ? parseInt(rating, 10) : null,
        photos: photos.filter(Boolean),
      });
      setOverlay(savedOverlay);
      if (onSaved) onSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("[SharedOverlayForm] save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const hasContent = notes || snap1 || snap2 || snap3 || rating || photos.some(Boolean);

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
        Add your perspective
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
          <>
            <Form.Group className="mb-2">
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
            {[
              { label: "Snap 1", value: snap1, setter: setSnap1, placeholder: "A quick memory..." },
              { label: "Snap 2", value: snap2, setter: setSnap2, placeholder: "A small detail..." },
              { label: "Snap 3", value: snap3, setter: setSnap3, placeholder: "How it made you feel..." },
            ].map((field) => (
              <Form.Group className="mb-2" key={field.label}>
                <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                  {field.label}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={1}
                  maxLength={140}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  placeholder={field.placeholder}
                  style={{ fontSize: "var(--font-size-sm)" }}
                />
              </Form.Group>
            ))}
            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                Rating
              </Form.Label>
              <div className="d-flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(String(star))}
                    className="btn btn-link p-0 text-decoration-none"
                    style={{
                      fontSize: "1.25rem",
                      lineHeight: 1,
                      color: star <= parseInt(rating || "0", 10) ? "#f5a623" : "#ccc",
                    }}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  >
                    {star <= parseInt(rating || "0", 10) ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </Form.Group>
            <div className="mb-2">
              <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "0.375rem" }}>
                Photos
              </div>
              <div className="row g-2">
                {[0, 1, 2].map((index) => (
                  <div className="col-4" key={index}>
                    <PhotoUploadField
                      field={{ name: `overlayPhoto${index + 1}`, label: `Photo ${index + 1}` }}
                      value={photos[index] || ""}
                      onChange={(url) => setPhotoAt(index, url)}
                      itemId={itemId}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
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
  const { mutationVersion, incrementVersion } = useSocialData();
  const itemId = item.id;
  const [overlayRefreshKey, setOverlayRefreshKey] = useState(0);
  const refreshKey = overlayRefreshKey + mutationVersion;

  return (
    <>
      {schema.map((field) => {
        if (field.hidden || !isFieldVisible(field, item)) return null;
        if (headerFieldNames.has(field.name)) return null;
        if (field.type === "photo") return null;
        if (field.renderAs === "stars") return null;
        if (/^snapshot\d$/.test(field.name)) return null;

        const value = item[field.name];
        if (!value || (Array.isArray(value) && value.length === 0)) return null;

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

      <SharingInfo item={item} contacts={contacts} navigate={navigate} />
      <SocialMemoriesSection
        item={item}
        contacts={contacts}
        refreshKey={refreshKey}
      />

      {item._isShared && (
        <SharedOverlayForm
          itemId={itemId}
          onSaved={() => { setOverlayRefreshKey((key) => key + 1); incrementVersion(); }}
        />
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
