import React, { useState } from "react";
import { Badge, Button } from "react-bootstrap";
import { isFieldVisible, getSnapshotTeaser, getAllSnapshots } from "helpers/operator";
import { getStatusLabel } from "helpers/statusLabels";
import { getCategoryMeta } from "helpers/categoryMeta";

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
 * Redesigned card list with visual hierarchy:
 * - Photo thumbnail / category icon placeholder
 * - Primary title, secondary info, date, status badge
 * - Expand/collapse for full detail
 */
function ItemCardList({
  category = "",
  title,
  items = [],
  schema = [],
  onEdit,
  onDelete,
  renderItemExtras,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const meta = getCategoryMeta(category);

  if (!Array.isArray(items)) {
    console.warn("ItemCardList received non-array items:", items);
    return null;
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPrimaryLabel = (item) => {
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
                  {/* Thumbnail or icon placeholder */}
                  <div
                    className="item-card-thumb"
                    style={{
                      backgroundColor: item.photoLink
                        ? "transparent"
                        : meta.color,
                    }}
                  >
                    {item.photoLink ? (
                      <img
                        src={item.photoLink}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "inherit",
                        }}
                      />
                    ) : (
                      <span role="img" aria-hidden="true">
                        {meta.icon}
                      </span>
                    )}
                  </div>

                  {/* Text content */}
                  <div className="item-card-body">
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <h6 className="item-card-title">
                        {getPrimaryLabel(item)}
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
                    {item[meta.dateField] && (
                      <div className="item-card-date">
                        {formatDisplayDate(item[meta.dateField])}
                        {item.endDate &&
                          item.endDate !== item[meta.dateField] &&
                          ` – ${formatDisplayDate(item.endDate)}`}
                      </div>
                    )}
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
                              ) : Array.isArray(value) ? (
                                <ol className="mb-0 ps-3" style={{ fontSize: "var(--font-size-sm)" }}>
                                  {value.map((v, i) => (
                                    <li key={i}>{v}</li>
                                  ))}
                                </ol>
                              ) : (
                                value
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {renderItemExtras && renderItemExtras(item)}

                      {(onEdit || onDelete) && (
                        <div className="mt-3 d-flex gap-2">
                          {onEdit && (
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => onEdit(itemId)}
                            >
                              Edit
                            </Button>
                          )}
                          {onDelete && (
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
