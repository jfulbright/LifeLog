import React from "react";
import { Badge } from "react-bootstrap";
import { getStatusLabel } from "../../helpers/statusLabels";
import { getCategoryMeta } from "../../helpers/categoryMeta";
import PrivacyIndicator from "./PrivacyIndicator";

const EVENT_TYPE_EMOJI = {
  concert: "🎵",
  sports: "🏟️",
  broadway: "🎭",
  comedy: "🎤",
  festival: "🎪",
  other: "📅",
};

function getStatusBadgeVariant(status) {
  switch (status) {
    case "attended":
    case "visited":
    case "owned":
    case "watched":
    case "done":
    case "tried":
    case "happened":
      return "success";
    case "wishlist":
    case "watchlist":
      return "primary";
    case "upcoming":
      return "info";
    case "rented":
    case "cellar":
      return "info";
    default:
      return "secondary";
  }
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function EntryHeader({ item, category, schema, contacts, onClick }) {
  const meta = getCategoryMeta(category);

  const getPrimaryLabel = () => {
    if (meta.getPrimaryDisplay) return meta.getPrimaryDisplay(item) || "Untitled";
    return (
      item[meta.primaryField] || item.artist || item.title || item.teams ||
      item.showName || item.eventName || item.type || item.make || "Untitled"
    );
  };

  const getSecondaryLabel = () => {
    if (meta.getSecondaryDisplay) return meta.getSecondaryDisplay(item);
    const US_VARIANTS = new Set(["US", "USA", "United States", "United States of America", "us", "usa"]);
    return meta.secondaryFields
      .filter((f) => !(f === "country" && US_VARIANTS.has(item[f])))
      .map((f) => item[f])
      .filter(Boolean)
      .join(", ");
  };

  const typeValue = item.eventType || item.subType || item.activityType;
  const typeField = schema?.find((f) => f.name === "eventType" || f.name === "subType" || f.name === "activityType");
  const typeLabel = typeValue
    ? (typeField?.optionLabels?.[typeValue] || typeValue.charAt(0).toUpperCase() + typeValue.slice(1))
    : null;
  const typeEmoji = typeValue ? (EVENT_TYPE_EMOJI[typeValue] || meta.icon) : null;

  const statusVariant = getStatusBadgeVariant(item.status);
  const badgeClass = "";

  const thumbSrc = item.photo1 || item.posterUrl || item.photoLink;

  return (
    <div
      className="item-card-header"
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    >
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

      <div className="item-card-body">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <h6 className="item-card-title">
            {getPrimaryLabel()}
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

        {getSecondaryLabel() && (
          <p className="item-card-subtitle">
            {getSecondaryLabel()}
          </p>
        )}

        {!item._isShared && item.shareWithCompanionIds?.length > 0 && (
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: 500, marginTop: "0.15rem" }}>
            🤝 Shared experience
          </div>
        )}

        {typeLabel && (
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", fontWeight: 600, marginTop: "0.2rem" }}>
            {typeEmoji} {typeLabel}
          </div>
        )}

        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {item[meta.dateField] && (
            <span>
              {"📅"} {formatDisplayDate(item[meta.dateField])}
              {item.endDate && item.endDate !== item[meta.dateField] && ` – ${formatDisplayDate(item.endDate)}`}
            </span>
          )}
          {item._isShared && (
            <span style={{ fontWeight: 600 }}>
              {"🤝"} Shared with you by{" "}
              <span style={{ color: "var(--color-primary)" }}>
                {(() => {
                  const c = contacts?.find((ct) => ct.linkedUserId === item._sharedBy);
                  return c?.displayName || "Someone";
                })()}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default EntryHeader;
