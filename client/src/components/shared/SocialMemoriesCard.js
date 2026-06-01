import React, { useState, useEffect } from "react";
import overlayService from "../../services/overlayService";
import {
  normalizeSocialContributions,
  hasContributionContent,
} from "../../helpers/socialContent";
import PhotoGrid from "./PhotoGrid";
import StarRating from "./StarRating";
import Avatar from "./Avatar";

const FUTURE_STATUSES = new Set(["wishlist", "watchlist", "want-to", "planned"]);

function ContributorTile({ contribution, onEdit, itemStatus }) {
  const snaps = contribution.snaps || [];
  const photos = contribution.photos || [];
  const showWhyNotes = FUTURE_STATUSES.has(itemStatus);

  return (
    <div className="contributor-tile">
      <Avatar avatarUrl={contribution.avatarUrl} displayName={contribution.displayName} size={32} className="contributor-avatar" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>
            {contribution.displayName}
          </span>
          {contribution.isOwner && !contribution.isMine && (
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", background: "var(--color-surface-hover, #f5f5f5)", borderRadius: 4, padding: "0.1rem 0.4rem", fontWeight: 600 }}>
              Owner
            </span>
          )}
          <StarRating rating={contribution.rating} />
          {contribution.isMine && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              style={{ background: "none", border: "none", padding: 0, fontSize: "var(--font-size-xs)", color: "var(--color-primary)", fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}
            >
              Edit
            </button>
          )}
        </div>
        {snaps.map((snap, i) => (
          <div key={i} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.2rem" }}>
            {"✨"} {snap}
          </div>
        ))}
        {showWhyNotes && contribution.whyNotes && (
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "0.25rem", fontStyle: "italic" }}>
            {contribution.whyNotes}
          </div>
        )}
        {photos.length > 0 && (
          <div style={{ marginTop: "0.375rem" }}>
            <PhotoGrid photos={photos.slice(0, 3)} height={60} />
          </div>
        )}
      </div>
    </div>
  );
}

function SocialMemoriesCard({ item, contacts, refreshKey, contributions: externalContributions, onEditOverlay, expanded = false, title: customTitle, subtitle: customSubtitle }) {
  const [contributions, setContributions] = useState(externalContributions || item._socialContributions || []);

  useEffect(() => {
    if (externalContributions) {
      setContributions(externalContributions);
      return;
    }
    let cancelled = false;
    overlayService.getOverlaysForEntry(item.id).then((overlays) => {
      if (!cancelled) {
        setContributions(normalizeSocialContributions(item, overlays, contacts));
      }
    }).catch(() => {
      if (!cancelled) setContributions(item._socialContributions || []);
    });
    return () => { cancelled = true; };
  }, [item, contacts, refreshKey, externalContributions]);

  const visibleContributions = contributions.filter(hasContributionContent);
  if (visibleContributions.length === 0) return null;

  const MAX_IN_CARD = expanded ? visibleContributions.length : 2;
  const cardContributions = visibleContributions.slice(0, MAX_IN_CARD);
  const shareeCount = visibleContributions.filter((c) => !c.isOwner).length;

  const gridClass = cardContributions.length === 1
    ? "perspectives-grid perspectives-grid--single"
    : "perspectives-grid";

  return (
    <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: 8, background: "linear-gradient(135deg, #F9F5FB 0%, #F0F7FE 100%)", border: "1px solid rgba(74, 21, 75, 0.08)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.625rem" }}>
        <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>
          {customTitle || "Shared Memories"}
        </span>
        {(customSubtitle || shareeCount > 0) && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
            {customSubtitle || `${shareeCount} collaborator contribution${shareeCount !== 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      <div className={gridClass}>
        {cardContributions.map((contribution) => (
          <ContributorTile
            key={`${contribution.userId || "owner"}-${contribution.isOwner ? "o" : "c"}`}
            contribution={contribution}
            onEdit={contribution.isMine && onEditOverlay ? onEditOverlay : undefined}
            itemStatus={item.status}
          />
        ))}
      </div>

    </div>
  );
}

export default SocialMemoriesCard;
