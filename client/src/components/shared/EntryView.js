import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { isFieldVisible } from "../../helpers/operator";
import { getAllSocialPhotos } from "../../helpers/socialContent";
import { getPeopleWithCollabStatus } from "../../helpers/peopleDisplay";
import { renderFieldValue } from "../../helpers/renderFieldValue";
import collaboratorService from "../../services/collaboratorService";
import PhotoGrid from "./PhotoGrid";
import WhoWasTherePills from "./WhoWasTherePills";
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
  renderItemExtras,
  expanded = false,
  onShowDetails,
}) {
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState([]);

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
  const people = getPeopleWithCollabStatus(item.companions, collaborators, contacts);
  const hasPeople = people.length > 0;

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
        {hasPeople && (
          <div style={{ marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
              {"👥"} Who was there?
            </div>
            <WhoWasTherePills people={people} />
          </div>
        )}
        <SharingInfo item={item} navigate={navigate} />
      </div>

      {/* ─── Shared Memories (all contributors expanded) ─── */}
      <SharedMemoriesSection item={item} contacts={contacts} expanded={true} />

      {/* ─── Actions ─── */}
      {(onEdit || onDelete) && (
        <div className="d-flex gap-2" style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
          {onEdit && (
            <Button size="sm" variant="outline-primary" onClick={onEdit}>Edit</Button>
          )}
          {onDelete && !item._isShared && (
            <Button size="sm" variant="outline-danger" onClick={onDelete}>Delete</Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EntryView;
