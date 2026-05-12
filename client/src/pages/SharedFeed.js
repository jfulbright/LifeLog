import React, { useState, useEffect, useCallback } from "react";
import { Button, Badge } from "react-bootstrap";
import dataService from "../services/dataService";
import collaboratorService from "../services/collaboratorService";
import overlayService from "../services/overlayService";
import { useAppData } from "../contexts/AppDataContext";
import { RING_META, RING_LEVELS } from "../helpers/ringMeta";
import categoryMeta from "../helpers/categoryMeta";

/**
 * SharedFeed — Phase 7b
 *
 * Shows entries that have been shared with contacts (via ring visibility or
 * individual tags). Each entry appears with a status:
 *   - "pending"  → tagged but not yet accepted
 *   - "accepted" → accepted; user can add their own overlays (Phase 7c)
 *   - "declined" → declined; hidden from feed
 *
 * NOTE: Until Phase 6 auth is added, this simulates the tagged person's view
 * by showing entries you've shared outward. Once Phase 6 links real accounts,
 * the API will filter entries directed at the authenticated user.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEntryDisplayTitle(entry) {
  if (entry.artist) return entry.artist;
  if (entry.title) return entry.title;
  if (entry.make) return `${entry.make}${entry.model ? " " + entry.model : ""}`.trim();
  return entry.type || "Entry";
}

function getEntrySubtitle(entry) {
  const parts = [];
  if (entry.venue) parts.push(entry.venue);
  if (entry.city) parts.push(entry.city);
  if (entry.country && entry.country !== "US") parts.push(entry.country);
  return parts.join(", ");
}

function formatDateRange(entry) {
  if (!entry.startDate) return null;
  if (!entry.endDate || entry.startDate === entry.endDate) return entry.startDate;
  return `${entry.startDate} — ${entry.endDate}`;
}

// ── Shared Entry Card ─────────────────────────────────────────────────────────

function SharedEntryCard({ entry, tag, contacts, onAccept, onDecline, onViewOverlays }) {
  const meta = categoryMeta[entry._category] || {};

  // Find who shared this with us
  const sharedByContact = entry._ownerId
    ? contacts.find((c) => c.linkedUserId === entry._ownerId)
    : null;
  const sharedByName = sharedByContact?.displayName || "Someone";

  const tagStatus = entry._collabStatus || tag?.status || "pending";

  return (
    <div
      className="shared-entry-card"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderLeft: `4px solid ${meta.color || "var(--color-primary)"}`,
        borderRadius: "var(--card-radius)",
        padding: "1rem 1.25rem",
        marginBottom: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: meta.color || "var(--color-primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            flexShrink: 0,
          }}
        >
          {meta.icon || "📝"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "var(--font-size-base)", color: "var(--color-text-primary)" }}>
              {getEntryDisplayTitle(entry)}
            </span>
            <StatusBadge status={tagStatus} />
          </div>

          {getEntrySubtitle(entry) && (
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "0.125rem" }}>
              {getEntrySubtitle(entry)}
            </div>
          )}

          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {formatDateRange(entry) && <span>📅 {formatDateRange(entry)}</span>}
            <span>
              Shared by <strong>{sharedByName}</strong>
            </span>
          </div>

          {entry.snapshot1 && (
            <div
              style={{
                marginTop: "0.5rem",
                fontStyle: "italic",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
                borderLeft: "2px solid var(--color-border)",
                paddingLeft: "0.625rem",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              "{entry.snapshot1}"
            </div>
          )}
        </div>
      </div>

      {tagStatus === "pending" && (
        <div
          style={{
            marginTop: "0.875rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", flex: 1 }}>
            Accept to add your own snapshots and rating 📸
          </span>
          <Button variant="primary" size="sm" onClick={() => onAccept(entry)}>
            Accept
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={() => onDecline(entry)}>
            Decline
          </Button>
        </div>
      )}

      {tagStatus === "accepted" && (
        <div
          style={{
            marginTop: "0.875rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button variant="outline-primary" size="sm" onClick={() => onViewOverlays(entry, tag)}>
            View &amp; Add Snapshots
          </Button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    pending: { label: "Pending", bg: "var(--color-warning)", color: "#1D1C1D" },
    accepted: { label: "Accepted", bg: "var(--color-success)", color: "#fff" },
    declined: { label: "Declined", bg: "var(--color-danger)", color: "#fff" },
  };
  const c = config[status] || config.pending;
  return (
    <span
      style={{
        fontSize: "0.65rem",
        fontWeight: 700,
        padding: "0.1rem 0.5rem",
        borderRadius: 8,
        background: c.bg,
        color: c.color,
      }}
    >
      {c.label}
    </span>
  );
}

// ── Overlay Modal (Phase 7c preview) ─────────────────────────────────────────

function OverlayPanel({ entry, tag, overlays, contacts, onClose, onSave }) {
  const { contacts: allContacts } = useAppData();
  const myOverlay = overlays.find((o) => o.contactId === tag?.contactId) || {};
  const othersOverlays = overlays.filter((o) => o.contactId !== tag?.contactId);

  const [snap1, setSnap1] = useState(myOverlay.snapshot1 || "");
  const [snap2, setSnap2] = useState(myOverlay.snapshot2 || "");
  const [snap3, setSnap3] = useState(myOverlay.snapshot3 || "");
  const [rating, setRating] = useState(myOverlay.rating || "");
  const [saving, setSaving] = useState(false);

  const title = getEntryDisplayTitle(entry);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      entryId: entry.id,
      contactId: tag?.contactId || "self",
      snapshot1: snap1,
      snapshot2: snap2,
      snapshot3: snap3,
      rating,
    });
    setSaving(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 2000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-surface)",
          borderRadius: "16px 16px 0 0",
          padding: "1.5rem",
          width: "100%",
          maxWidth: 560,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h6 style={{ fontWeight: 700, margin: 0 }}>Your Snapshots — {title}</h6>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", lineHeight: 1, cursor: "pointer", color: "var(--color-text-tertiary)" }}>×</button>
        </div>

        <div className="snap-section-banner" style={{ marginBottom: "1rem" }}>
          <span className="snap-section-icon">📸</span>
          <div>
            <div className="snap-section-title">Add your perspective</div>
            <div className="snap-section-subtitle">Your snaps are visible to everyone tagged on this entry</div>
          </div>
        </div>

        {[
          { val: snap1, set: setSnap1, label: "✨ Snap 1" },
          { val: snap2, set: setSnap2, label: "✨ Snap 2" },
          { val: snap3, set: setSnap3, label: "✨ Snap 3" },
        ].map(({ val, set, label }) => (
          <div key={label} className="snapshot-field-group mb-3">
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", fontStyle: "italic" }}>{label}</label>
            <textarea
              className="snap-capture-textarea"
              style={{ height: 72, resize: "vertical" }}
              maxLength={140}
              value={val}
              onChange={(e) => set(e.target.value)}
              placeholder="Add a quick memory…"
            />
            <div style={{ textAlign: "right", fontSize: "0.7rem", color: "var(--color-text-tertiary)" }}>{val.length}/140</div>
          </div>
        ))}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.375rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Rating</label>
          <div className="d-flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(String(star))}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: star <= parseInt(rating) ? "#f5a623" : "#ccc" }}
              >
                {star <= parseInt(rating) ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>

        <Button variant="primary" className="w-100" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save My Snapshots"}
        </Button>

        {othersOverlays.length > 0 && (
          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <div style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", marginBottom: "0.75rem" }}>What others thought</div>
            {othersOverlays.map((overlay) => {
              const contact = allContacts.find((c) => c.id === overlay.contactId);
              const snaps = [overlay.snapshot1, overlay.snapshot2, overlay.snapshot3].filter(Boolean);
              if (!snaps.length) return null;
              return (
                <div key={overlay.id} style={{ marginBottom: "0.875rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", marginBottom: "0.25rem" }}>
                    {contact ? contact.displayName : "Someone"}
                    {overlay.rating && (
                      <span style={{ marginLeft: "0.5rem", color: "#f5a623", fontWeight: 400 }}>
                        {"★".repeat(parseInt(overlay.rating))}{"☆".repeat(5 - parseInt(overlay.rating))}
                      </span>
                    )}
                  </div>
                  {snaps.map((s, i) => (
                    <div key={i} style={{ fontSize: "var(--font-size-sm)", fontStyle: "italic", color: "var(--color-text-secondary)", borderLeft: "2px solid var(--color-border)", paddingLeft: "0.625rem", marginBottom: "0.375rem" }}>
                      "{s}"
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main SharedFeed Page ──────────────────────────────────────────────────────

function SharedFeed() {
  const { contacts, refreshNotifications } = useAppData();
  const [allItems, setAllItems] = useState([]);
  const [entryTags, setEntryTags] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRing, setFilterRing] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [overlayTarget, setOverlayTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try real multi-user collaborator queries first
      const collabs = await collaboratorService.getIncomingCollaborations();
      if (collabs.length > 0 || true) {
        // Fetch entry data for each collaboration
        const enriched = await Promise.all(
          collabs.map(async (collab) => {
            const { data: row } = await (await import("../services/supabaseClient")).supabase
              .from("items")
              .select("data, category")
              .eq("id", collab.entry_id)
              .single();
            return {
              ...collab,
              entry: row?.data || null,
              _category: row?.category || collab.entry_category,
            };
          })
        );
        setAllItems(enriched.filter((e) => e.entry));
        setEntryTags([]);
        setOverlays([]);
        setLoading(false);
        return;
      }
    } catch {
      // Fall back to localStorage-based approach if collaborators table isn't ready
    }

    const [items, tags, personalOverlays] = await Promise.all([
      dataService.getAllItems(),
      dataService.getEntryTags(),
      dataService.getPersonalOverlays(),
    ]);
    setAllItems(items);
    setEntryTags(tags);
    setOverlays(personalOverlays);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Determine if we're in new (collaborator) mode or legacy mode
  const isCollaboratorMode = allItems.length > 0 && allItems[0]?.entry_id;

  const sharedEntries = isCollaboratorMode
    ? allItems.map((collab) => ({
        ...collab.entry,
        _category: collab._category,
        _collabId: collab.id,
        _collabStatus: collab.status,
        _ownerId: collab.owner_id,
        id: collab.entry_id,
      }))
    : allItems.filter(
        (item) =>
          (item.visibilityRings && item.visibilityRings.length > 0) ||
          (item.taggedContactIds && item.taggedContactIds.length > 0)
      );

  const filteredEntries = sharedEntries.filter((item) => {
    if (isCollaboratorMode) {
      if (filterStatus !== "all" && item._collabStatus !== filterStatus) return false;
      return true;
    }
    if (filterRing !== "all") {
      const ringNum = parseInt(filterRing);
      if (!(item.visibilityRings || []).includes(ringNum)) return false;
    }
    if (filterStatus !== "all") {
      const tag = entryTags.find((t) => t.entryId === item.id);
      if (!tag || tag.status !== filterStatus) return false;
    }
    return true;
  });

  const handleAccept = async (item) => {
    if (isCollaboratorMode) {
      await collaboratorService.acceptCollaboration(item._collabId);
    } else {
      const tag = entryTags.find((t) => t.entryId === item.id);
      if (tag) await dataService.updateEntryTag(tag.id, { status: "accepted" });
    }
    await load();
    refreshNotifications();
    window.dispatchEvent(new Event("data-changed"));
  };

  const handleDecline = async (item) => {
    if (isCollaboratorMode) {
      await collaboratorService.declineCollaboration(item._collabId);
    } else {
      const tag = entryTags.find((t) => t.entryId === item.id);
      if (tag) await dataService.updateEntryTag(tag.id, { status: "declined" });
    }
    await load();
    refreshNotifications();
    window.dispatchEvent(new Event("data-changed"));
  };

  const handleViewOverlays = (entry, tag) => {
    setOverlayTarget({ entry, tag });
  };

  const handleSaveOverlay = async (overlayData) => {
    try {
      await overlayService.saveOverlay(overlayData.entryId, overlayData);
    } catch {
      await dataService.savePersonalOverlay(overlayData);
    }
    await load();
    setOverlayTarget(null);
    window.dispatchEvent(new Event("data-changed"));
  };

  const pendingCount = isCollaboratorMode
    ? allItems.filter((c) => c.status === "pending").length
    : entryTags.filter((t) => t.status === "pending").length;

  return (
    <div>
      <div className="dashboard-aubergine-banner" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", gap: "1rem" }}>
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
            Shared Experiences
            {pendingCount > 0 && (
              <Badge bg="warning" text="dark" style={{ marginLeft: "0.5rem", fontSize: "0.7rem", verticalAlign: "middle" }}>
                {pendingCount} pending
              </Badge>
            )}
          </h4>
          <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "var(--font-size-sm)" }}>
            Trips, events, and memories others have invited you to collaborate on.
          </p>
        </div>
      </div>

      {/* Info */}
      <div
        style={{
          background: "linear-gradient(135deg, #EAF8FE 0%, #F5EEF8 100%)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--card-radius)",
          padding: "0.875rem 1rem",
          marginBottom: "1.25rem",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
        }}
      >
        Entries shared with you by others appear here. Accept to add them to your timeline and contribute your own Snapshots.
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Ring</div>
          <div className="status-toggle">
            <button
              type="button"
              className={`btn btn-sm ${filterRing === "all" ? "active" : ""}`}
              onClick={() => setFilterRing("all")}
            >
              All
            </button>
            {RING_LEVELS.map((level) => {
              const meta = RING_META[level];
              return (
                <button
                  key={level}
                  type="button"
                  className={`btn btn-sm ${filterRing === String(level) ? "active" : ""}`}
                  onClick={() => setFilterRing(String(level))}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Status</div>
          <div className="status-toggle">
            {["all", "pending", "accepted", "declined"].map((s) => (
              <button
                key={s}
                type="button"
                className={`btn btn-sm ${filterStatus === s ? "active" : ""}`}
                onClick={() => setFilterStatus(s)}
                style={{ textTransform: "capitalize" }}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-tertiary)" }}>Loading…</div>
      ) : filteredEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-info)", color: "#fff" }}>🤝</div>
          <div className="empty-state-title">Nothing shared yet</div>
          <div className="empty-state-text">
            Entries you share with your rings or tag contacts on will appear here. Start by adding an entry and choosing who to share it with.
          </div>
        </div>
      ) : (
        filteredEntries.map((item) => {
          const tag = entryTags.find((t) => t.entryId === item.id);
          return (
            <SharedEntryCard
              key={item.id}
              entry={item}
              tag={tag}
              contacts={contacts}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onViewOverlays={handleViewOverlays}
            />
          );
        })
      )}

      {overlayTarget && (
        <OverlayPanel
          entry={overlayTarget.entry}
          tag={overlayTarget.tag}
          overlays={overlays.filter((o) => o.entryId === overlayTarget.entry.id)}
          contacts={contacts}
          onClose={() => setOverlayTarget(null)}
          onSave={handleSaveOverlay}
        />
      )}
    </div>
  );
}

export default SharedFeed;
