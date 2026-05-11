import React from "react";

/**
 * Determines if an entry has been shared with anyone (rings or individuals).
 */
export function isEntryShared(item) {
  if (!item) return false;
  if (item.visibilityRings && item.visibilityRings.length > 0) return true;
  if (item.taggedContactIds && item.taggedContactIds.length > 0) return true;
  if (item.shareWithCompanionIds && item.shareWithCompanionIds.length > 0) return true;
  if (item.recommendedToRings && item.recommendedToRings.length > 0) return true;
  if (item.recommendedToContacts && item.recommendedToContacts.length > 0) return true;
  if (item._sharedBy || item.sharedByUserId) return true;
  return false;
}

/**
 * Small visual indicator showing whether an entry is private or shared.
 * Always rendered on every entry to build user confidence about privacy.
 */
function PrivacyIndicator({ item, style = {} }) {
  const shared = isEntryShared(item);

  return (
    <span
      title={shared ? "Shared with others" : "Private \u2014 only you"}
      style={{
        fontSize: "0.7rem",
        color: shared ? "var(--color-info, #36C5F0)" : "var(--color-text-tertiary, #9E9E9E)",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.2rem",
        cursor: "default",
        ...style,
      }}
    >
      {shared ? "\uD83D\uDC65" : "\uD83D\uDD12"}
    </span>
  );
}

export default PrivacyIndicator;
