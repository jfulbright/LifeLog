import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { isFieldVisible } from "../../helpers/operator";
import { getAllSocialPhotos } from "../../helpers/socialContent";
import { RING_META } from "../../helpers/ringMeta";
import { renderFieldValue } from "../../helpers/renderFieldValue";
import collaboratorService from "../../services/collaboratorService";
import PhotoGrid from "./PhotoGrid";
import PeoplePills from "./PeoplePills";
import SharingInfo from "./SharingInfo";
import SharedMemoriesSection from "./SharedMemoriesSection";

const SOCIAL_FIELD_NAMES = new Set(["companions", "visibilityControl", "recommendation"]);

function EntryView({
  item,
  category,
  schema,
  contacts,
  headerFieldNames,
  onEdit,
  onDelete,
  onLeave,
  renderItemExtras,
  expanded = false,
  onShowDetails,
}) {
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!expanded || !item?.id) return;
    let cancelled = false;
    collaboratorService.getCollaboratorsForEntry(item.id).then((rows) => {
      if (!cancelled) setCollaborators(rows);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [expanded, item?.id]);

  const US_VARIANTS = new Set(["US", "USA", "United States", "United States of America", "us", "usa"]);

  const allFields = schema.filter((field) => {
    if (field.hidden || field.type === "hidden" || !isFieldVisible(field, item)) return false;
    if (headerFieldNames?.has(field.name)) return false;
    if (field.type === "photo") return false;
    if (field.renderAs === "stars") return false;
    if (/^snapshot\d$/.test(field.name)) return false;
    if (field.name === "title") return false;
    if (field.name === "eventType" || field.name === "subType" || field.name === "activityType") return false;
    if (SOCIAL_FIELD_NAMES.has(field.name)) return false;
    if (field.name === "country" && US_VARIANTS.has(item[field.name])) return false;
    const value = item[field.name];
    if (!value || (Array.isArray(value) && value.length === 0)) return false;
    return true;
  });

  const photos = [item.photo1, item.photo2, item.photo3].filter(Boolean);

  // Full carousel set: owner photos + each collaborator's photos with attribution.
  // Falls back to own photos when no social data is loaded yet.
  const socialPhotos = getAllSocialPhotos(item);
  const lightboxPhotos = socialPhotos.length > 0
    ? socialPhotos.map(({ contribution, url }) => ({
        url,
        label: contribution.displayName,
        avatarUrl: contribution.avatarUrl,
      }))
    : photos.map((url) => ({ url }));
  const companions = item.companions;
  const hasCompanions = Array.isArray(companions) && companions.length > 0;
  const hasCollaborators = collaborators.length > 0;
  const hasVisibility = (item.visibilityRings || []).length > 0;

  if (!expanded) {
    return (
      <div>
        {renderItemExtras && renderItemExtras(item)}

        <SharedMemoriesSection item={item} contacts={contacts} expanded={false} />

        {onShowDetails && (
          <button
            type="button"
            onClick={onShowDetails}
            style={{
              background: "none",
              border: "none",
              padding: "0.5rem 0",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            See Details
            <span style={{ fontSize: "var(--font-size-xs)" }}>{"→"}</span>
          </button>
        )}
      </div>
    );
  }

  // Expanded view — full detail modal content (header rendered by parent)
  return (
    <div>

      {/* ─── Photos ─── */}
      {photos.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <PhotoGrid photos={photos} lightboxPhotos={lightboxPhotos} height={200} />
        </div>
      )}

      {/* ─── Event Details ─── */}
      {allFields.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Event Details
          </div>
          {allFields.map((field) => (
            <div key={field.name} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem", fontSize: "var(--font-size-sm)" }}>
              <span style={{ color: "var(--color-text-tertiary)", minWidth: "5.5rem", flexShrink: 0, fontWeight: 500 }}>{field.label}</span>
              <span style={{ color: "var(--color-text-primary)" }}>
                {renderFieldValue(field, item[field.name])}
              </span>
            </div>
          ))}
        </div>
      )}

      {renderItemExtras && renderItemExtras(item)}

      {/* ─── People & Visibility ─── */}
      <div style={{ marginBottom: "1.25rem", padding: "0.75rem", background: "var(--color-surface-hover, #f9f9f9)", borderRadius: 8 }}>
        <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
          People & Visibility
        </div>
        {hasCompanions && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
              {"👥"} Who was there?
            </div>
            <PeoplePills people={companions} contacts={contacts} />
          </div>
        )}
        {hasCollaborators && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
              {"🤝"} Shared Collaborators
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {collaborators.map((collab) => {
                const contact = contacts.find((c) => c.id === collab.collaborator_contact_id || c.linkedUserId === collab.collaborator_user_id);
                const ring = contact ? RING_META[contact.ringLevel] : null;
                const name = contact?.displayName || collab._profileName || "Collaborator";
                const isPending = collab.status === "pending";
                return (
                  <span key={collab.id || collab.collaborator_user_id} style={{ background: isPending ? "var(--color-warning-bg, #FFF3CD)" : ring ? ring.bgColor : "var(--color-surface-hover)", border: `1px solid ${isPending ? "var(--color-warning, #ECB22E)" : ring ? ring.borderColor : "var(--color-border)"}`, borderRadius: 10, padding: "0.1rem 0.5rem", fontSize: "0.75rem", color: isPending ? "var(--color-warning-text, #856404)" : ring ? ring.color : "var(--color-text-secondary)", fontWeight: 600, opacity: isPending ? 0.85 : 1 }}>
                    {ring ? ring.emoji + " " : ""}{name}{collab._isOwner ? " (Owner)" : ""}{isPending ? " (Pending)" : ""}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {hasVisibility && (
          <SharingInfo item={item} contacts={contacts} navigate={navigate} />
        )}
        {!hasCompanions && !hasCollaborators && !hasVisibility && (
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
            No people tagged yet
          </div>
        )}
      </div>

      {/* ─── Shared Memories (all contributors expanded) ─── */}
      <SharedMemoriesSection item={item} contacts={contacts} expanded={true} />

      {/* ─── Edit history (E4) ─── */}
      {Array.isArray(item.editHistory) && item.editHistory.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            {"🕓"} Edit history ({item.editHistory.length}) {showHistory ? "▲" : "▼"}
          </button>
          {showHistory && (
            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {[...item.editHistory].reverse().map((h, i) => {
                const who = (contacts || []).find((c) => c.linkedUserId === h.editedBy)?.displayName || "A collaborator";
                return (
                  <div key={i} style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {new Date(h.editedAt).toLocaleDateString()} &middot; <strong>{who}</strong> edited {(h.fields || []).join(", ")}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Actions ─── */}
      {(onEdit || onDelete || (onLeave && item._isShared)) && (
        <div className="d-flex gap-2" style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
          {onEdit && (
            <Button size="sm" variant="outline-primary" onClick={onEdit}>Edit</Button>
          )}
          {onDelete && !item._isShared && (
            <Button size="sm" variant="outline-danger" onClick={onDelete}>Delete</Button>
          )}
          {onLeave && item._isShared && (
            <Button size="sm" variant="outline-danger" onClick={onLeave}>Leave</Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EntryView;
