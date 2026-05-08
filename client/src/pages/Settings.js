import React, { useState, useCallback } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { useAppData } from "../contexts/AppDataContext";
import dataService from "../services/dataService";
import FormPanel from "../components/shared/FormPanel";
import { RING_META, RING_LEVELS, INVITE_STATUS_META } from "../helpers/ringMeta";

// ── Avatar ────────────────────────────────────────────────────────────────────

function ContactAvatar({ displayName, ringLevel, size = 44 }) {
  const ring = RING_META[ringLevel];
  const initials = (displayName || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: ring ? ring.color : "#9E9E9E",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        letterSpacing: "-0.5px",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ── Contact Form (add / edit) ─────────────────────────────────────────────────

function ContactForm({ initial = {}, onSave, onDelete, onCancel, isEditing }) {
  const [email, setEmail] = useState(initial.email || "");
  const [displayName, setDisplayName] = useState(initial.displayName || "");
  const [ringLevel, setRingLevel] = useState(initial.ringLevel || 3);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showRingWarning, setShowRingWarning] = useState(false);

  const handleRingChange = (level) => {
    if (isEditing && level !== initial.ringLevel) {
      setShowRingWarning(true);
    } else {
      setShowRingWarning(false);
    }
    setRingLevel(level);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError("Email is required.");
    if (!displayName.trim()) return setError("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Please enter a valid email address.");
    }
    setSaving(true);
    try {
      await onSave({ email: email.trim(), displayName: displayName.trim(), ringLevel });
    } catch (err) {
      setError(err.message || "Could not save contact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label htmlFor="contact-email">
          Email <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          id="contact-email"
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isEditing}
        />
        {isEditing && (
          <Form.Text className="text-muted">Email cannot be changed after adding.</Form.Text>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="contact-name">
          Display name <span className="text-danger">*</span>
        </Form.Label>
        <Form.Control
          id="contact-name"
          type="text"
          placeholder="How you refer to them"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Ring</Form.Label>
        <div className="d-flex gap-2 flex-wrap mt-1">
          {RING_LEVELS.map((level) => {
            const meta = RING_META[level];
            const active = ringLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleRingChange(level)}
                className="ring-pill-btn"
                style={{
                  background: active ? meta.color : "var(--color-surface)",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  border: `2px solid ${active ? meta.color : "var(--color-border)"}`,
                  borderRadius: 20,
                  padding: "0.375rem 1rem",
                  fontWeight: active ? 700 : 500,
                  fontSize: "var(--font-size-sm)",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
                aria-pressed={active}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
        <Form.Text className="text-muted" style={{ marginTop: "0.5rem", display: "block" }}>
          {RING_META[ringLevel]?.description}
        </Form.Text>
      </Form.Group>

      {showRingWarning && (
        <Alert variant="warning" className="mb-3" style={{ fontSize: "var(--font-size-sm)" }}>
          Changing a ring only affects <strong>future</strong> entries. Past entries shared with{" "}
          {RING_META[initial.ringLevel]?.label} will remain visible to them.
        </Alert>
      )}

      <div className="d-flex gap-2 mt-4">
        <Button
          variant="primary"
          type="submit"
          className="flex-grow-1"
          disabled={saving}
        >
          {saving ? "Saving…" : isEditing ? "Update Contact" : "Add to My People"}
        </Button>
        {onCancel && (
          <Button variant="outline-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>

      {isEditing && onDelete && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={onDelete}
            className="w-100"
          >
            Remove from My People
          </Button>
        </div>
      )}
    </Form>
  );
}

// ── Contact Card ──────────────────────────────────────────────────────────────

function ContactCard({ contact, onEdit }) {
  const ring = RING_META[contact.ringLevel];
  const statusMeta = INVITE_STATUS_META[contact.inviteStatus] || INVITE_STATUS_META.local_only;

  return (
    <button
      type="button"
      className="contact-card"
      onClick={() => onEdit(contact)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--card-radius)",
        width: "100%",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 150ms ease, box-shadow 150ms ease",
        marginBottom: "0.5rem",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--color-surface-hover)";
        e.currentTarget.style.boxShadow = "var(--card-shadow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--color-surface)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <ContactAvatar displayName={contact.displayName} ringLevel={contact.ringLevel} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", color: "var(--color-text-primary)" }}>
          {contact.displayName}
        </div>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {contact.email}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
        {ring && (
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: ring.color,
              background: ring.bgColor,
              border: `1px solid ${ring.borderColor}`,
              borderRadius: 10,
              padding: "0.1rem 0.5rem",
              whiteSpace: "nowrap",
            }}
          >
            {ring.emoji} {ring.label}
          </span>
        )}
        <span style={{ fontSize: "0.65rem", color: statusMeta.color, fontWeight: 600 }}>
          {statusMeta.dot} {statusMeta.label}
        </span>
      </div>
    </button>
  );
}

// ── Ring Section ──────────────────────────────────────────────────────────────

function RingSection({ ringLevel, contacts, onEdit }) {
  const meta = RING_META[ringLevel];
  const ringContacts = contacts.filter((c) => c.ringLevel === ringLevel);

  return (
    <div className="ring-section" style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.375rem 0 0.5rem",
          borderBottom: `2px solid ${meta.color}`,
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ fontSize: "1rem" }}>{meta.emoji}</span>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--font-size-base)",
            color: meta.color,
            letterSpacing: "-0.3px",
          }}
        >
          {meta.label}
        </span>
        <span
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-tertiary)",
            fontWeight: 500,
          }}
        >
          {ringContacts.length > 0 ? `(${ringContacts.length})` : "— empty"}
        </span>
        {ringLevel === 1 && ringContacts.length > 5 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-warning)",
              fontWeight: 600,
            }}
          >
            ✨ Inner Circle works best kept small
          </span>
        )}
      </div>

      {ringContacts.length === 0 ? (
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-tertiary)",
            fontStyle: "italic",
            padding: "0.5rem 0",
          }}
        >
          No one in your {meta.label} yet.
        </div>
      ) : (
        ringContacts.map((c) => (
          <ContactCard key={c.id} contact={c} onEdit={onEdit} />
        ))
      )}
    </div>
  );
}

// ── My People Tab ─────────────────────────────────────────────────────────────

function MyPeopleTab() {
  const { contacts, refreshContacts } = useAppData();
  const [showPanel, setShowPanel] = useState(false);
  const [editContact, setEditContact] = useState(null);

  const handleAdd = () => {
    setEditContact(null);
    setShowPanel(true);
  };

  const handleEdit = (contact) => {
    setEditContact(contact);
    setShowPanel(true);
  };

  const handleClose = () => {
    setShowPanel(false);
    setEditContact(null);
  };

  const handleSave = useCallback(
    async (data) => {
      if (editContact) {
        await dataService.updateContact(editContact.id, data);
      } else {
        await dataService.addContact(data);
      }
      await refreshContacts();
      window.dispatchEvent(new Event("data-changed"));
      handleClose();
    },
    [editContact, refreshContacts]
  );

  const handleDelete = useCallback(async () => {
    if (!editContact) return;
    if (
      window.confirm(
        `Remove ${editContact.displayName} from your people?\n\nEntries they were tagged on will remain unchanged.`
      )
    ) {
      await dataService.deleteContact(editContact.id);
      await refreshContacts();
      window.dispatchEvent(new Event("data-changed"));
      handleClose();
    }
  }, [editContact, refreshContacts]);

  const hasAnyContacts = contacts.length > 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.25rem",
          gap: "1rem",
        }}
      >
        <div>
          <h5 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>My People 👥</h5>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
            Organize the people in your life. Ring assignments determine who can see your shared entries.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
          + Add Person
        </Button>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--card-radius)",
          padding: "0.875rem 1rem",
          marginBottom: "1.5rem",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
        }}
      >
        <strong style={{ color: "var(--color-text-primary)" }}>How rings work:</strong> Adding someone to a ring doesn't notify them — it just determines who sees your shared entries. They'll only know you added them when you tag them on something. Ring changes are not retroactive.
      </div>

      {!hasAnyContacts ? (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            👥
          </div>
          <div className="empty-state-title">No people yet</div>
          <div className="empty-state-text">
            Add the people you share life moments with — family, friends, your inner circle.
          </div>
          <Button variant="primary" onClick={handleAdd}>
            Add Your First Person
          </Button>
        </div>
      ) : (
        RING_LEVELS.map((level) => (
          <RingSection
            key={level}
            ringLevel={level}
            contacts={contacts}
            onEdit={handleEdit}
          />
        ))
      )}

      <FormPanel
        show={showPanel}
        onHide={handleClose}
        title={editContact ? `Edit ${editContact.displayName}` : "Add Person"}
      >
        <ContactForm
          key={editContact ? editContact.id : "new"}
          initial={editContact || {}}
          isEditing={!!editContact}
          onSave={handleSave}
          onDelete={editContact ? handleDelete : undefined}
          onCancel={handleClose}
        />
      </FormPanel>
    </div>
  );
}

// ── Placeholder Tabs ──────────────────────────────────────────────────────────

function NotificationsTab() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ backgroundColor: "var(--color-warning)", color: "#fff" }}>
        🔔
      </div>
      <div className="empty-state-title">Notifications</div>
      <div className="empty-state-text">
        In-app alerts for tags and new co-participant snaps will live here. Coming in Phase 7c.
      </div>
    </div>
  );
}

function AccountTab() {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" style={{ backgroundColor: "var(--color-info)", color: "#fff" }}>
        🔐
      </div>
      <div className="empty-state-title">Account</div>
      <div className="empty-state-text">
        Login, profile, and data management will live here once authentication is added in Phase 6.
      </div>
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "people", label: "My People", icon: "👥" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "account", label: "Account", icon: "🔐" },
];

function Settings() {
  const [activeTab, setActiveTab] = useState("people");

  return (
    <div>
      <div className="dashboard-aubergine-banner" />

      <h4 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Settings ⚙️</h4>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
        Manage your people, sharing preferences, and account.
      </p>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          borderBottom: "2px solid var(--color-border)",
          marginBottom: "1.5rem",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: -2,
              padding: "0.625rem 1rem",
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
              transition: "color 150ms ease, border-color 150ms ease",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 640 }}>
        {activeTab === "people" && <MyPeopleTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "account" && <AccountTab />}
      </div>
    </div>
  );
}

export default Settings;
