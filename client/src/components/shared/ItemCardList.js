import React, { useState, useEffect } from "react";
import { Badge, Button } from "react-bootstrap";
import { isFieldVisible, getAllSnapshots, getItemPhotos } from "../../helpers/operator";
import { getStatusLabel } from "../../helpers/statusLabels";
import { getCategoryMeta } from "../../helpers/categoryMeta";
import { useAppData } from "../../contexts/AppDataContext";
import { RING_META } from "../../helpers/ringMeta";
import dataService from "../../services/dataService";
import PhotoGrid from "./PhotoGrid";
import PrivacyIndicator from "./PrivacyIndicator";

/**
 * Returns the Bootstrap badge variant for a status value.
 */
function getStatusBadgeVariant(status) {
  switch (status) {
    case "attended":
    case "visited":
    case "owned":
      return "success";
    case "wishlist":
      return "warning";
    case "rented":
      return "info";
    default:
      return "secondary";
  }
}

/**
 * Formats a date string (YYYY-MM-DD) to a readable format (e.g. "Mar 15, 2024").
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Renders a companions array (which can be legacy strings or new contact objects).
 */
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

/**
 * Shows sharing metadata (rings + tagged contacts) on the expanded card.
 */
function SharingInfo({ item, contacts }) {
  const rings = item.visibilityRings || [];
  const taggedIds = item.taggedContactIds || [];
  if (rings.length === 0 && taggedIds.length === 0) return null;

  const ringLabels = rings.map((r) => RING_META[r]).filter(Boolean);
  const taggedContacts = taggedIds
    .map((id) => contacts.find((c) => c.id === id))
    .filter(Boolean);

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
      <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        🤝 Shared with
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
        {ringLabels.map((ring) => (
          <span
            key={ring.label}
            style={{
              background: ring.bgColor,
              border: `1px solid ${ring.borderColor}`,
              borderRadius: 10,
              padding: "0.1rem 0.5rem",
              color: ring.color,
              fontWeight: 700,
              fontSize: "0.7rem",
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
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                padding: "0.1rem 0.5rem",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: "0.7rem",
              }}
            >
              {ring ? ring.emoji : ""} {c.displayName}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Phase 7c: Renders co-participant personal overlays.
 */
function CoParticipantOverlays({ itemId, contacts }) {
  const [overlays, setOverlays] = useState([]);

  useEffect(() => {
    dataService.getOverlaysForEntry(itemId).then(setOverlays);
  }, [itemId]);

  // Check if any overlay has snaps or photos
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
function ItemCardList({
  category = "",
  title,
  items = [],
  schema = [],
  onEdit,
  onDelete,
  renderItemExtras,
  renderCompactExtra,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const meta = getCategoryMeta(category);
  const { contacts } = useAppData();

  if (!Array.isArray(items)) {
    console.warn("ItemCardList received non-array items:", items);
    return null;
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPrimaryLabel = (item) => {
    if (meta.getPrimaryDisplay) {
      return meta.getPrimaryDisplay(item) || "Untitled";
    }
    return (
      item[meta.primaryField] ||
      item.artist ||
      item.title ||
      item.type ||
      item.make ||
      "Untitled"
    );
  };

  const getSecondaryLabel = (item) => {
    if (meta.getSecondaryDisplay) return meta.getSecondaryDisplay(item);
    return meta.secondaryFields
      .map((f) => item[f])
      .filter(Boolean)
      .join(", ");
  };

  // Fields to skip in the detail view (already shown in the compact header)
  const headerFieldNames = new Set([
    meta.primaryField,
    ...meta.secondaryFields,
    meta.dateField,
    "status",
    "endDate",
  ]);

  return (
    <div>
      {title && (
        <h5 className="mb-3" style={{ fontWeight: 600 }}>
          {title}
        </h5>
      )}
      <div className="d-flex flex-column" style={{ gap: "var(--spacing-card-gap)" }}>
        {items.map((item, index) => {
          const itemId = item.id ?? index;
          const isExpanded = expandedId === itemId;
          const statusVariant = getStatusBadgeVariant(item.status);
          const badgeClass =
            statusVariant === "warning" ? "text-dark" : "";

          return (
            <div key={itemId} className="card">
              <div className="item-card">
                {/* Compact header: thumbnail + info + badge */}
                <div className="item-card-header">
                  {/* Thumbnail: first photo → photoLink → category icon */}
                  {(() => {
                    const thumbSrc = item.photo1 || item.posterUrl || item.photoLink;
                    return (
                      <div
                        className="item-card-thumb"
                        style={{ backgroundColor: thumbSrc ? "transparent" : meta.color }}
                      >
                        {thumbSrc ? (
                          <img
                            src={thumbSrc}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                          />
                        ) : (
                          <span role="img" aria-hidden="true">{meta.icon}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Text content */}
                  <div className="item-card-body">
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <h6 className="item-card-title">
                        {getPrimaryLabel(item)}
                        <PrivacyIndicator item={item} style={{ marginLeft: "0.4rem" }} />
                      </h6>
                      {item.status && (
                        <Badge
                          bg={statusVariant}
                          className={`badge-status flex-shrink-0 ${badgeClass}`}
                        >
                          {getStatusLabel(category, item.status)}
                        </Badge>
                      )}
                    </div>
                    {getSecondaryLabel(item) && (
                      <p className="item-card-subtitle">
                        {getSecondaryLabel(item)}
                      </p>
                    )}
                    {item._isShared && (
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-info)", fontWeight: 600, marginTop: "0.15rem" }}>
                        🤝 Shared with you
                      </div>
                    )}
                    {item[meta.dateField] && (
                      <div className="item-card-date">
                        {formatDisplayDate(item[meta.dateField])}
                        {item.endDate &&
                          item.endDate !== item[meta.dateField] &&
                          ` – ${formatDisplayDate(item.endDate)}`}
                      </div>
                    )}
                    {renderCompactExtra && renderCompactExtra(item)}
                  </div>
                </div>

                {/* Snapshot teasers when collapsed — show all non-empty snapshots */}
                {!isExpanded && getAllSnapshots(item).map((snap, i) => (
                  <div key={i} className="snapshot-teaser">
                    &#10024; &ldquo;{snap}&rdquo;
                  </div>
                ))}

                {/* Expand/collapse toggle */}
                <button
                  className="item-card-toggle"
                  onClick={() => toggleExpand(itemId)}
                >
                  {isExpanded ? "Hide details" : "Show details"}
                  <span style={{ fontSize: "0.625rem" }}>
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </span>
                </button>

                {/* Expanded detail view */}
                <div
                  className={`item-card-details ${isExpanded ? "expanded" : ""}`}
                >
                  {isExpanded && (
                    <>
                      {schema.map((field) => {
                        if (field.hidden || !isFieldVisible(field, item))
                          return null;
                        if (headerFieldNames.has(field.name)) return null;
                        // Photo fields are rendered via PhotoGrid above — skip here
                        if (field.type === "photo") return null;

                        const value = item[field.name];
                        if (
                          !value ||
                          (Array.isArray(value) && value.length === 0)
                        )
                          return null;

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

                      {/* Owner's photos */}
                      {getItemPhotos(item).length > 0 && (
                        <div style={{ marginTop: "0.75rem" }}>
                          <PhotoGrid photos={getItemPhotos(item)} height={140} />
                        </div>
                      )}

                      <SharingInfo item={item} contacts={contacts} />
                      <CoParticipantOverlays itemId={itemId} contacts={contacts} />

                      {renderItemExtras && renderItemExtras(item)}

                      {(onEdit || onDelete) && (
                        <div className="mt-3 d-flex gap-2">
                          {onEdit && !item._isShared && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => onEdit(itemId)}
                            >
                              Edit
                            </Button>
                          )}
                          {onDelete && !item._isShared && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => onDelete(itemId)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ItemCardList;
