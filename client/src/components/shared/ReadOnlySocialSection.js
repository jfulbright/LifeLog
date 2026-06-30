import React, { useState, useEffect } from "react";
import { RING_META } from "../../helpers/ringMeta";
import collaboratorService from "../../services/collaboratorService";
import connectionService from "../../services/connectionService";
import { supabase } from "../../services/supabaseClient";
import PeoplePills from "./PeoplePills";

function ReadOnlySocialSection({ item, contacts }) {
  const [collaborators, setCollaborators] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [requestedIds, setRequestedIds] = useState([]);

  useEffect(() => {
    if (!item?.id) return;
    let cancelled = false;
    collaboratorService.getCollaboratorsForEntry(item.id).then((rows) => {
      if (!cancelled) setCollaborators(rows);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [item?.id]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setCurrentUserId(data?.user?.id || null);
    });
    connectionService.getOutgoingPendingRecipientIds().then((ids) => {
      if (!cancelled) setRequestedIds(ids);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Connect to a co-collaborator we are not yet connected to (B1 reveal → B2).
  const connectedUserIds = new Set((contacts || []).map((c) => c.linkedUserId).filter(Boolean));
  const handleConnect = async (uid) => {
    setRequestedIds((prev) => [...prev, uid]);
    try {
      await connectionService.requestConnection(uid);
    } catch (err) {
      console.error("[ReadOnlySocialSection] connect failed:", err);
      setRequestedIds((prev) => prev.filter((x) => x !== uid));
    }
  };

  const companions = item.companions;
  const hasCompanions = Array.isArray(companions) && companions.length > 0;
  const hasCollaborators = collaborators.length > 0;
  const visibilityRings = item.visibilityRings || [];

  if (!hasCompanions && !hasCollaborators) return null;

  const sectionStyle = {
    marginBottom: "1rem",
    padding: "0.75rem",
    background: "var(--color-surface-hover, #f9f9f9)",
    borderRadius: 8,
    border: "1px solid var(--color-border, #e0e0e0)",
  };
  const labelStyle = {
    fontSize: "var(--font-size-xs, 0.75rem)",
    fontWeight: 600,
    color: "var(--color-text-secondary, #696969)",
    marginBottom: "0.375rem",
  };

  return (
    <div style={sectionStyle}>
      <div style={{ fontSize: "var(--font-size-xs, 0.75rem)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
        People & Visibility
      </div>
      {hasCompanions && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={labelStyle}>{"👥"} Who was there?</div>
          <PeoplePills people={companions} contacts={contacts} />
        </div>
      )}
      {hasCollaborators && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={labelStyle}>{"🤝"} Shared Collaborators</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {collaborators.map((collab) => {
              const contact = contacts.find((c) => c.id === collab.collaborator_contact_id || c.linkedUserId === collab.collaborator_user_id);
              const ring = contact ? RING_META[contact.ringLevel] : null;
              const name = contact?.displayName || collab._profileName || "Collaborator";
              const isPending = collab.status === "pending";
              const uid = collab.collaborator_user_id;
              const canConnect = uid && uid !== currentUserId && !connectedUserIds.has(uid);
              const requested = requestedIds.includes(uid);
              return (
                <span key={collab.id || collab.collaborator_user_id} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ background: isPending ? "var(--color-warning-bg, #FFF3CD)" : ring ? ring.bgColor : "var(--color-surface-hover)", border: `1px solid ${isPending ? "var(--color-warning, #ECB22E)" : ring ? ring.borderColor : "var(--color-border)"}`, borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", color: isPending ? "var(--color-warning-text, #856404)" : ring ? ring.color : "var(--color-text-secondary)", fontWeight: 600, opacity: isPending ? 0.85 : 1 }}>
                    {ring ? ring.emoji + " " : ""}{name}{collab._isOwner ? " (Owner)" : ""}{isPending ? " (Pending)" : ""}
                  </span>
                  {canConnect && (
                    requested ? (
                      <span style={{ fontSize: "0.65rem", color: "var(--color-text-tertiary)", fontWeight: 600 }}>Requested</span>
                    ) : (
                      <button type="button" onClick={() => handleConnect(uid)} style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--color-primary)", background: "transparent", border: "1px solid var(--color-primary)", borderRadius: 10, padding: "0.05rem 0.45rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                        + Connect
                      </button>
                    )
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <div style={labelStyle}>{"🔒"} Who can see this</div>
        {visibilityRings.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {visibilityRings.map((ringLevel) => {
              const ring = RING_META[ringLevel];
              if (!ring) return null;
              return (
                <span key={ringLevel} style={{ background: ring.bgColor, border: `1px solid ${ring.borderColor}`, borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", color: ring.color, fontWeight: 600 }}>
                  {ring.emoji} {ring.label}
                </span>
              );
            })}
          </div>
        ) : (
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
            Private (only collaborators)
          </span>
        )}
      </div>
    </div>
  );
}

export default ReadOnlySocialSection;
