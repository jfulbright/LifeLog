import React, { useState, useEffect } from "react";
import overlayService from "../../services/overlayService";
import {
  normalizeSocialContributions,
  hasContributionContent,
} from "../../helpers/socialContent";
import PhotoGrid from "./PhotoGrid";

function ContributionRow({ contribution }) {
  const [expanded, setExpanded] = useState(false);
  const snaps = contribution.snaps || [];
  const hasMore = snaps.length > 1 || contribution.photos.length > 0;

  return (
    <div
      style={{
        marginBottom: "0.75rem",
        paddingLeft: "0.75rem",
        borderLeft: contribution.isOwner
          ? "2px solid var(--color-primary)"
          : "2px solid var(--color-border)",
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
        {contribution.displayName}
        {contribution.isOwner && (
          <span style={{ fontSize: "0.7rem", color: "var(--color-text-tertiary)", fontWeight: 700 }}>
            Owner
          </span>
        )}
        {contribution.rating && (
          <span style={{ color: "#f5a623", letterSpacing: "0.05em" }}>
            {"★".repeat(parseInt(contribution.rating, 10))}
            {"☆".repeat(5 - parseInt(contribution.rating, 10))}
          </span>
        )}
      </div>

      {contribution.whyNotes && (
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
          {contribution.whyNotes}
        </div>
      )}

      {snaps.length > 0 && (
        <div style={{ fontStyle: "italic", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.2rem" }}>
          &ldquo;{snaps[0]}&rdquo;
        </div>
      )}

      {expanded && snaps.slice(1).map((snap, i) => (
        <div key={i} style={{ fontStyle: "italic", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.2rem" }}>
          &ldquo;{snap}&rdquo;
        </div>
      ))}

      {expanded && contribution.photos.length > 0 && (
        <div style={{ marginTop: "0.375rem" }}>
          <PhotoGrid photos={contribution.photos} height={100} />
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            marginTop: "0.25rem",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-primary)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

function SocialMemoriesCard({ item, contacts, refreshKey, contributions: externalContributions }) {
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
        Shared memories
      </div>
      {visibleContributions.map((contribution) => (
        <ContributionRow
          key={`${contribution.userId || "owner"}-${contribution.isOwner ? "owner" : "overlay"}`}
          contribution={contribution}
        />
      ))}
    </div>
  );
}

export default SocialMemoriesCard;
