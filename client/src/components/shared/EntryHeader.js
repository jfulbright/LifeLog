import React from "react";
import { getCategoryMeta, getEntryTitle, getEntrySubtitle } from "../../helpers/categoryMeta";
import { formatDisplayDate } from "../../helpers/dateUtils";
import StatusBadge from "./StatusBadge";
import PrivacyIndicator from "./PrivacyIndicator";

const EVENT_TYPE_EMOJI = {
  concert: "🎵",
  sports: "🏟️",
  broadway: "🎭",
  comedy: "🎤",
  festival: "🎪",
  other: "📅",
};

function EntryHeader({ item, category, schema, contacts, onClick }) {
  const meta = getCategoryMeta(category);

  const getPrimaryLabel = () => getEntryTitle(category, item);
  const getSecondaryLabel = () => getEntrySubtitle(category, item);

  const typeValue = item.eventType || item.subType || item.activityType;
  const typeField = schema?.find((f) => f.name === "eventType" || f.name === "subType" || f.name === "activityType");
  const typeLabel = typeValue
    ? (typeField?.optionLabels?.[typeValue] || typeValue.charAt(0).toUpperCase() + typeValue.slice(1))
    : null;
  const typeEmoji = typeValue ? (EVENT_TYPE_EMOJI[typeValue] || meta.icon) : null;

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
          <StatusBadge category={category} status={item.status} />
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
          {!item._isShared && item.recommendedBy && typeof item.recommendedBy === "object" && (
            <span style={{ fontWeight: 600 }}>
              {"⭐"} Recommended by{" "}
              <span style={{ color: "var(--color-primary)" }}>
                {(() => {
                  if (Array.isArray(item.recommendedBy)) {
                    const names = item.recommendedBy.map((r) => r.displayName || "Someone");
                    if (names.length <= 2) return names.join(", ");
                    return `${names.slice(0, 2).join(", ")} and ${names.length - 2} other${names.length - 2 > 1 ? "s" : ""}`;
                  }
                  return item.recommendedBy.displayName || "Someone";
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
