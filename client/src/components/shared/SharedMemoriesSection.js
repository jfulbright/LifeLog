import React, { useState } from "react";
import { useSocialData } from "../../contexts/SocialDataContext";
import SocialMemoriesCard from "./SocialMemoriesCard";
import OverlayForm from "./OverlayForm";

function contributionToOverlayShape(contribution) {
  if (!contribution) return null;
  return {
    snapshot1: contribution.snaps?.[0] || "",
    snapshot2: contribution.snaps?.[1] || "",
    snapshot3: contribution.snaps?.[2] || "",
    why_notes: contribution.whyNotes || "",
    rating: contribution.rating || null,
    photos: contribution.photos || [],
  };
}

function SharedMemoriesSection({ item, contacts, onOverlaySaved, expanded = false }) {
  const { mutationVersion, incrementVersion } = useSocialData();
  const [showOverlayForm, setShowOverlayForm] = useState(false);
  const [overlayRefreshKey, setOverlayRefreshKey] = useState(0);

  const refreshKey = overlayRefreshKey + mutationVersion;
  const hasMyContribution = item._myOverlayContribution != null;

  const handleSaved = () => {
    setOverlayRefreshKey((k) => k + 1);
    incrementVersion();
    setShowOverlayForm(false);
    if (onOverlaySaved) onOverlaySaved();
  };

  return (
    <div>
      <SocialMemoriesCard
        item={item}
        contacts={contacts}
        refreshKey={refreshKey}
        onEditOverlay={hasMyContribution ? () => setShowOverlayForm(true) : undefined}
        expanded={expanded}
      />

      {item._isShared && !hasMyContribution && !showOverlayForm && (
        <button
          type="button"
          onClick={() => setShowOverlayForm(true)}
          style={{
            background: "none",
            border: "none",
            padding: "0.5rem 0",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            color: "var(--color-primary)",
          }}
        >
          + Add your memories
        </button>
      )}

      {item._isShared && showOverlayForm && (
        <div style={{
          marginTop: "0.75rem",
          padding: "0.75rem",
          background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
          borderRadius: 8,
          border: "1px solid var(--color-border)",
        }}>
          <OverlayForm
            entryId={item.id}
            entryStatus={item.status}
            onSaved={handleSaved}
            onCancel={() => setShowOverlayForm(false)}
            initialOverlay={contributionToOverlayShape(item._myOverlayContribution)}
            showPhotos
          />
        </div>
      )}
    </div>
  );
}

export default SharedMemoriesSection;
