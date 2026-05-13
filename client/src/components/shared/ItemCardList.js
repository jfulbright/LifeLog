import React, { useState } from "react";
import { Badge } from "react-bootstrap";
import { getAllSnapshots } from "../../helpers/operator";
import { getSocialPreview } from "../../helpers/socialContent";
import { getStatusLabel } from "../../helpers/statusLabels";
import { getCategoryMeta } from "../../helpers/categoryMeta";
import { useAppData } from "../../contexts/AppDataContext";
import PrivacyIndicator from "./PrivacyIndicator";
import ItemDetailContent from "./ItemDetailContent";

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

function ItemCardList({
  category = "",
  title,
  items = [],
  schema = [],
  onEdit,
  onDelete,
  onViewDetail,
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
                <div
                  className="item-card-header"
                  onClick={onViewDetail ? () => onViewDetail(item) : undefined}
                  style={onViewDetail ? { cursor: "pointer" } : undefined}
                >
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
                        🤝 Shared with you{item._ownerName ? ` by ${item._ownerName}` : ""}
                      </div>
                    )}
                    {!item._isShared && item.shareWithCompanionIds?.length > 0 && (
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: 500, marginTop: "0.15rem" }}>
                        🤝 Shared experience
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

                {/* Snapshot teasers — always visible */}
                {getAllSnapshots(item).map((snap, i) => (
                  <div key={i} className="snapshot-teaser">
                    &#10024; &ldquo;{snap}&rdquo;
                  </div>
                ))}
                {getSocialPreview(item) && (
                  <div className="snapshot-teaser">
                    🤝 &ldquo;{getSocialPreview(item)}&rdquo;
                  </div>
                )}
                {item._shareeContributionCount > 0 && (
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: 600, marginTop: "0.35rem" }}>
                    {item._shareeContributionCount} collaborator contribution{item._shareeContributionCount === 1 ? "" : "s"}
                  </div>
                )}

                {/* Expand/collapse toggle */}
                <button
                  className="item-card-toggle"
                  onClick={() => toggleExpand(itemId)}
                  style={{
                    background: isExpanded ? "var(--color-surface-hover, #f5f5f5)" : "transparent",
                    border: "1px solid var(--color-border)",
                    borderRadius: 16,
                    padding: "0.3rem 0.75rem",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    marginTop: "0.5rem",
                    transition: "all 150ms ease",
                  }}
                >
                  {isExpanded ? "Hide details" : "Show details"}
                  <span style={{ fontSize: "0.5rem" }}>
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </span>
                </button>

                {/* Expanded detail view */}
                <div
                  className={`item-card-details ${isExpanded ? "expanded" : ""}`}
                  style={isExpanded ? {
                    background: "var(--color-bg, #f9f9fb)",
                    borderRadius: 8,
                    padding: "0.75rem",
                    marginTop: "0.5rem",
                    border: "1px solid var(--color-border)",
                  } : undefined}
                >
                  {isExpanded && (
                    <ItemDetailContent
                      item={item}
                      category={category}
                      schema={schema}
                      contacts={contacts}
                      headerFieldNames={headerFieldNames}
                      onEdit={onEdit ? () => onEdit(itemId) : undefined}
                      onDelete={onDelete ? () => onDelete(itemId) : undefined}
                      renderItemExtras={renderItemExtras}
                    />
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
