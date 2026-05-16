import React, { useState, useEffect, useCallback } from "react";
import { Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import collaboratorService from "../services/collaboratorService";
import overlayService from "../services/overlayService";
import OverlayForm from "../components/shared/OverlayForm";
import { useAppData } from "../contexts/AppDataContext";
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
  const meta = categoryMeta[entry._category];
  if (meta?.getPrimaryDisplay) {
    const display = meta.getPrimaryDisplay(entry);
    if (display) return display;
  }
  if (meta?.primaryField && entry[meta.primaryField]) {
    return entry[meta.primaryField];
  }
  if (entry.artist) return entry.artist;
  if (entry.title) return entry.title;
  if (entry.activityType) return entry.activityType;
  if (entry.wineName) return entry.wineName;
  if (entry.whiskyName) return entry.whiskyName;
  if (entry.make) return `${entry.make}${entry.model ? " " + entry.model : ""}`.trim();
  return entry.type || "Entry";
}

function getEntrySubtitle(entry) {
  const meta = categoryMeta[entry._category];
  if (meta?.getSecondaryDisplay) {
    const display = meta.getSecondaryDisplay(entry);
    if (display) return display;
  }
  if (meta?.secondaryFields) {
    const parts = meta.secondaryFields.map((f) => entry[f]).filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }
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

function SharedEntryCard({ entry, tag, contacts, onAccept, onDecline, onViewOverlays, onEditShared, onLeaveShare }) {
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
            {entry.status && (
              <span style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "0.1rem 0.4rem",
                borderRadius: 6,
                background: entry.status === "wishlist" ? "var(--color-warning)" : "var(--color-success)",
                color: entry.status === "wishlist" ? "#1D1C1D" : "#fff",
                textTransform: "capitalize",
              }}>
                {entry.status}
              </span>
            )}
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
        <div style={{ marginTop: "0.875rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <Link
              to={`/${entry._category || "travel"}`}
              style={{ fontSize: "var(--font-size-xs)", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}
            >
              View in {(entry._category || "category").charAt(0).toUpperCase() + (entry._category || "").slice(1)} &rarr;
            </Link>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onLeaveShare && onLeaveShare(entry)}
              style={{ fontSize: "var(--font-size-xs)" }}
            >
              Leave
            </Button>
          </div>
          <OverlayForm entryId={entry.id} entryStatus={entry.status} onSaved={() => {}} />
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

// ── Overlay Modal ────────────────────────────────────────────────────────────

function OverlayPanel({ entry, tag, overlays, contacts, onClose, onSave }) {
  const { contacts: allContacts } = useAppData();
  const [myOverlay, setMyOverlay] = useState({});
  const [othersOverlays, setOthersOverlays] = useState([]);

  const [snap1, setSnap1] = useState("");
  const [snap2, setSnap2] = useState("");
  const [snap3, setSnap3] = useState("");
  const [rating, setRating] = useState("");
  const [saving, setSaving] = useState(false);

  const title = getEntryDisplayTitle(entry);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      overlayService.getMyOverlay(entry.id).catch(() => null),
      overlayService.getOverlaysForEntry(entry.id).catch(() => []),
    ]).then(([mine, all]) => {
      if (cancelled) return;
      const mineOverlay = mine || {};
      setMyOverlay(mineOverlay);
      setOthersOverlays((all || []).filter((overlay) => overlay.user_id !== mineOverlay.user_id));
      setSnap1(mineOverlay.snapshot1 || "");
      setSnap2(mineOverlay.snapshot2 || "");
      setSnap3(mineOverlay.snapshot3 || "");
      setRating(mineOverlay.rating ? String(mineOverlay.rating) : "");
    });
    return () => {
      cancelled = true;
    };
  }, [entry.id]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      entryId: entry.id,
      snapshot1: snap1,
      snapshot2: snap2,
      snapshot3: snap3,
      rating: rating ? parseInt(rating, 10) : null,
      photos: Array.isArray(myOverlay.photos) ? myOverlay.photos : [],
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
              const contact = allContacts.find((c) => c.linkedUserId === overlay.user_id);
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
  const [overlays, setOverlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [overlayTarget, setOverlayTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const collabs = await collaboratorService.getIncomingCollaborations();
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
      setOverlays([]);
    } catch (err) {
      console.error("[SharedFeed] load failed:", err);
      setAllItems([]);
      setOverlays([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sharedEntries = allItems.map((collab) => ({
        ...collab.entry,
        _category: collab._category,
        _collabId: collab.id,
        _collabStatus: collab.status,
        _ownerId: collab.owner_id,
        id: collab.entry_id,
      }));

  const filteredEntries = sharedEntries.filter((item) => {
    if (filterStatus !== "all" && item._collabStatus !== filterStatus) return false;
    return true;
  });

  const handleAccept = async (item) => {
    await collaboratorService.acceptCollaboration(item._collabId);
    await load();
    refreshNotifications();
    window.dispatchEvent(new Event("data-changed"));
  };

  const handleDecline = async (item) => {
    await collaboratorService.declineCollaboration(item._collabId);
    await load();
    refreshNotifications();
    window.dispatchEvent(new Event("data-changed"));
  };

  const handleViewOverlays = (entry, tag) => {
    setOverlayTarget({ entry, tag });
  };

  const handleEditShared = (entry) => {
    setEditTarget(entry);
  };

  const handleLeaveShare = async (entry) => {
    if (!window.confirm("This will remove this shared experience from your account. The owner will still have it. Continue?")) return;
    await collaboratorService.declineCollaboration(entry._collabId);
    await load();
    refreshNotifications();
    window.dispatchEvent(new Event("data-changed"));
  };

  const handleSaveOverlay = async (overlayData) => {
    await overlayService.saveOverlay(overlayData.entryId, overlayData);
    await load();
    setOverlayTarget(null);
    window.dispatchEvent(new Event("data-changed"));
  };

  const pendingCount = allItems.filter((c) => c.status === "pending").length;

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
          return (
            <SharedEntryCard
              key={item.id}
              entry={item}
              tag={null}
              contacts={contacts}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onViewOverlays={handleViewOverlays}
              onEditShared={handleEditShared}
              onLeaveShare={handleLeaveShare}
            />
          );
        })
      )}

      {overlayTarget && (
        <OverlayPanel
          entry={overlayTarget.entry}
          tag={overlayTarget.tag}
          overlays={overlays.filter((o) => o.entry_id === overlayTarget.entry.id)}
          contacts={contacts}
          onClose={() => setOverlayTarget(null)}
          onSave={handleSaveOverlay}
        />
      )}

      {editTarget && (
        <SharedEditPanel
          entry={editTarget}
          contacts={contacts}
          onClose={() => setEditTarget(null)}
          onSave={async (updatedData) => {
            try {
              const { supabase } = await import("../services/supabaseClient");
              const cleanData = Object.fromEntries(
                Object.entries(updatedData).filter(([key]) => !key.startsWith("_"))
              );
              await supabase
                .from("items")
                .update({ data: cleanData })
                .eq("id", editTarget.id);
              await load();
              setEditTarget(null);
              window.dispatchEvent(new Event("data-changed"));
            } catch (err) {
              console.error("[SharedFeed] edit save failed:", err);
            }
          }}
        />
      )}
    </div>
  );
}

function SharedEditPanel({ entry, contacts, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...entry });
  const [whyNotes, setWhyNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    overlayService.getMyOverlay(entry.id).then((o) => {
      if (o?.why_notes) setWhyNotes(o.why_notes);
    }).catch(() => {});
  }, [entry.id]);

  const meta = categoryMeta[entry._category] || {};
  const title = getEntryDisplayTitle(entry);

  const handleSave = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const updated = {
      ...formData,
      last_edited_at: now,
    };
    await onSave(updated);
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    try {
      await overlayService.saveOverlay(entry.id, { why_notes: whyNotes });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err) {
      console.error("[SharedEditPanel] notes save failed:", err);
    }
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
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h6 style={{ fontWeight: 700, margin: 0 }}>Edit — {title}</h6>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", lineHeight: 1, cursor: "pointer", color: "var(--color-text-tertiary)" }}>×</button>
        </div>

        {entry.last_edited_at && (
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "1rem", fontStyle: "italic" }}>
            Last updated {new Date(entry.last_edited_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {meta.icon} Category
          </label>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", fontWeight: 600 }}>
            {entry._category?.charAt(0).toUpperCase() + entry._category?.slice(1)}
            {entry.activityType && ` — ${entry.activityType}`}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "0.25rem" }}>City</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.city || ""}
              onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "0.25rem" }}>Country</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.country || ""}
              onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "0.25rem" }}>Start Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={formData.startDate || ""}
              onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "0.25rem" }}>End Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={formData.endDate || ""}
              onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
        </div>

        {entry.locationName !== undefined && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "0.25rem" }}>Venue / Location</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={formData.locationName || formData.venue || ""}
              onChange={(e) => setFormData((p) => ({ ...p, locationName: e.target.value, venue: e.target.value }))}
            />
          </div>
        )}

        <Button variant="primary" className="w-100 mb-3" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>

        {/* Collaborative "Why this..." notes section */}
        <div style={{
          borderTop: "1px solid var(--color-border)",
          paddingTop: "1rem",
          marginTop: "0.5rem",
        }}>
          {entry.wishlistReason && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>
                💭 Why this {entry._category === "activities" ? "activity" : entry._category === "travel" ? "place" : "experience"}
              </div>
              <div style={{
                fontStyle: "italic",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
                background: "var(--color-bg, #fafafa)",
                padding: "0.625rem 0.75rem",
                borderRadius: 6,
                borderLeft: "3px solid var(--color-primary)",
              }}>
                "{entry.wishlistReason}"
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: "0.375rem" }}>
              ✨ My thoughts / I have some ideas
            </label>
            <textarea
              className="form-control"
              rows={3}
              maxLength={500}
              value={whyNotes}
              onChange={(e) => setWhyNotes(e.target.value)}
              placeholder={entry.status === "wishlist" ? "What excites you? Any ideas for planning?" : "Your personal memory or notes..."}
              style={{ fontSize: "var(--font-size-sm)" }}
            />
            <div className="d-flex align-items-center gap-2 mt-2">
              <Button size="sm" variant="outline-primary" onClick={handleSaveNotes} disabled={!whyNotes.trim()}>
                Save Notes
              </Button>
              {notesSaved && (
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", fontWeight: 600 }}>
                  Saved!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedFeed;
