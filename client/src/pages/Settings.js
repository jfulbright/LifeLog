import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { useAppData } from "../contexts/AppDataContext";
import { useAuth } from "../contexts/AuthContext";
import contactsService from "../services/contactsService";
import inviteService from "../services/inviteService";
import profileService from "../services/profileService";
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
  const [phone, setPhone] = useState(initial.phone || "");
  const [ringLevel, setRingLevel] = useState(initial.ringLevel || 4);
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
      await onSave({ email: email.trim(), displayName: displayName.trim(), phone: phone.trim(), ringLevel });
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
        <Form.Label htmlFor="contact-phone">Phone</Form.Label>
        <Form.Control
          id="contact-phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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

function ContactCard({ contact, onEdit, onInvite }) {
  const ring = RING_META[contact.ringLevel];
  const statusMeta = INVITE_STATUS_META[contact.inviteStatus] || INVITE_STATUS_META.local_only;

  return (
    <div
      className="contact-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--card-radius)",
        width: "100%",
        marginBottom: "0.5rem",
      }}
    >
      <button
        type="button"
        onClick={() => onEdit(contact)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flex: 1,
          minWidth: 0,
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
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
      </button>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.375rem", flexShrink: 0 }}>
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
        {contact.inviteStatus === "local_only" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInvite(contact); }}
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#fff",
              background: "var(--color-primary)",
              border: "none",
              borderRadius: 10,
              padding: "0.2rem 0.6rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Send Invite
          </button>
        )}
        {contact.inviteStatus !== "local_only" && (
          <span style={{ fontSize: "0.65rem", color: statusMeta.color, fontWeight: 600 }}>
            {statusMeta.dot} {statusMeta.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Ring Section ──────────────────────────────────────────────────────────────

function RingSection({ ringLevel, contacts, onEdit, onInvite }) {
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
          {ringContacts.length > 0 ? `(${ringContacts.length})` : "\u2014 empty"}
        </span>
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
          <ContactCard key={c.id} contact={c} onEdit={onEdit} onInvite={onInvite} />
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
  const [inviteToast, setInviteToast] = useState(null);

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
        await contactsService.updateContact(editContact.id, data);
      } else {
        await contactsService.addContact(data);
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
      await contactsService.deleteContact(editContact.id);
      await refreshContacts();
      window.dispatchEvent(new Event("data-changed"));
      handleClose();
    }
  }, [editContact, refreshContacts]);

  const handleInvite = useCallback(async (contact) => {
    try {
      const invite = await inviteService.createInvite({
        inviteeEmail: contact.email,
        inviteeName: contact.displayName,
      });
      const url = inviteService.getInviteUrl(invite.token);
      await contactsService.updateContact(contact.id, { inviteStatus: "invited" });
      await refreshContacts();

      // Copy URL to clipboard
      await navigator.clipboard.writeText(url);
      setInviteToast(`Invite link copied! Share it with ${contact.displayName}.`);
      setTimeout(() => setInviteToast(null), 4000);
    } catch (err) {
      console.error("[MyPeopleTab] invite failed:", err);
      setInviteToast("Failed to create invite. Try again.");
      setTimeout(() => setInviteToast(null), 4000);
    }
  }, [refreshContacts]);

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
            onInvite={handleInvite}
          />
        ))
      )}

      {inviteToast && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            background: "var(--color-primary)",
            color: "#fff",
            padding: "0.75rem 1.25rem",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {inviteToast}
        </div>
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
  const [prefs, setPrefs] = useState({
    collab_snaps_inapp: true,
    invite_accepted_inapp: true,
  });
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    profileService.getMyProfile().then((profile) => {
      if (profile?.notification_preferences) {
        setPrefs((prev) => ({ ...prev, ...profile.notification_preferences }));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleToggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    profileService.updateProfile({ notification_preferences: updated })
      .then(() => { setSaveMsg("Saved"); setTimeout(() => setSaveMsg(null), 2000); })
      .catch(() => {});
  };

  const sectionStyle = {
    backgroundColor: "#fff",
    border: "1px solid var(--color-border, #EBEAEB)",
    borderRadius: 10,
    padding: "1.25rem 1.5rem",
    marginBottom: "1rem",
  };

  const labelStyle = {
    fontSize: "var(--font-size-sm, 0.875rem)",
    fontWeight: 600,
    color: "var(--color-text-secondary, #696969)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.75rem",
  };

  const rowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.625rem 0",
    borderBottom: "1px solid var(--color-border, #EBEAEB)",
  };

  if (loading) return <div style={{ color: "var(--color-text-tertiary)" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
        Control how you're notified about activity from your people.
      </p>

      <div style={sectionStyle}>
        <div style={labelStyle}>Collaboration</div>
        <div style={rowStyle}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>Someone shares an entry with you</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>Badge on Shared Experiences</div>
          </div>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", fontWeight: 700 }}>Always on</span>
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>Someone adds memories to a shared entry</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>When a collaborator adds Snaps or photos</div>
          </div>
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" role="switch"
              id="notif-collab-snaps"
              checked={prefs.collab_snaps_inapp} onChange={() => handleToggle("collab_snaps_inapp")} />
            <label htmlFor="notif-collab-snaps" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>In-app</label>
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Recommendations</div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>Someone recommends something to you</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>Badge on Recommendations</div>
          </div>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", fontWeight: 700 }}>Always on</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>People</div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>Someone you invited joins LifeSnaps</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>Know when your people are connected</div>
          </div>
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" role="switch"
              id="notif-invite-accepted"
              checked={prefs.invite_accepted_inapp} onChange={() => handleToggle("invite_accepted_inapp")} />
            <label htmlFor="notif-invite-accepted" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>In-app</label>
          </div>
        </div>
      </div>

      <div style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "0.75rem 1rem",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-tertiary)",
      }}>
        <strong style={{ color: "var(--color-text-secondary)" }}>Coming soon:</strong> Email notifications for collaboration requests, recommendations, and weekly digests.
      </div>

      {saveMsg && (
        <div style={{ marginTop: "0.75rem", fontSize: "var(--font-size-sm)", color: "var(--color-success)", fontWeight: 600 }}>
          {saveMsg}
        </div>
      )}
    </div>
  );
}

function AccountTab() {
  const { user, signOut, linkGoogleAccount } = useAuth();
  const [linkError, setLinkError] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const fileInputRef = useRef(null);

  const isGoogleLinked = user?.identities?.some((id) => id.provider === "google");
  const hasPasswordLogin = user?.identities?.some((id) => id.provider === "email");

  useEffect(() => {
    profileService.getMyProfile().then((p) => {
      setProfile(p);
      setProfileLoading(false);
    }).catch(() => setProfileLoading(false));
  }, []);

  const handleLinkGoogle = async () => {
    setLinkError(null);
    setLinkLoading(true);
    try {
      const { error } = await linkGoogleAccount();
      if (error) throw error;
    } catch (err) {
      setLinkError(err.message || "Failed to link Google account.");
      setLinkLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await profileService.updateProfile({
        display_name: profile.display_name,
        bio: profile.bio,
        phone: profile.phone,
        first_name: profile.first_name,
        last_name: profile.last_name,
      });
      setProfile(updated);
      setSaveMsg("Profile saved");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await profileService.uploadAvatar(file);
      setProfile((p) => ({ ...p, avatar_url: url }));
      setSaveMsg("Avatar updated");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveMsg("Avatar upload failed: " + (err.message || ""));
    }
  };

  const sectionStyle = {
    backgroundColor: "#fff",
    border: "1px solid var(--color-border, #EBEAEB)",
    borderRadius: 10,
    padding: "1.25rem 1.5rem",
    marginBottom: "1rem",
  };

  const labelStyle = {
    fontSize: "var(--font-size-sm, 0.875rem)",
    fontWeight: 600,
    color: "var(--color-text-secondary, #696969)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.75rem",
  };

  return (
    <div style={{ maxWidth: 480 }}>
      {/* Profile */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Your Profile</div>
        {profileLoading ? (
          <div style={{ color: "var(--color-text-tertiary)" }}>Loading...</div>
        ) : profile ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ position: "relative" }}>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: "50%",
                      backgroundColor: "var(--color-primary)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "1.25rem",
                    }}
                  >
                    {(profile.display_name || "?")[0].toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: "absolute", bottom: -2, right: -2,
                    width: 22, height: 22, borderRadius: "50%",
                    background: "var(--color-surface)", border: "1px solid var(--color-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: "0.65rem",
                  }}
                >
                  &#9998;
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {profile.display_name || user?.email}
                </div>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  {user?.email}
                </div>
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Display Name</Form.Label>
              <Form.Control
                type="text"
                value={profile.display_name || ""}
                onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                placeholder="How others see you"
              />
            </Form.Group>

            <div className="row g-2 mb-2">
              <div className="col-6">
                <Form.Label style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={profile.first_name || ""}
                  onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="col-6">
                <Form.Label style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={profile.last_name || ""}
                  onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                />
              </div>
            </div>

            <Form.Group className="mb-2">
              <Form.Label style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Phone</Form.Label>
              <Form.Control
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                Bio <span style={{ fontWeight: 400, color: "var(--color-text-tertiary)" }}>({(profile.bio || "").length}/140)</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                maxLength={140}
                value={profile.bio || ""}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="A snapshot of you in 140 chars"
              />
            </Form.Group>

            <div className="d-flex align-items-center gap-2">
              <Button variant="primary" size="sm" onClick={handleProfileSave} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
              {saveMsg && (
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-success)", fontWeight: 600 }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ color: "var(--color-text-tertiary)" }}>Could not load profile.</div>
        )}
      </div>

      {/* Connected accounts */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Connected accounts</div>

        {linkError && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setLinkError(null)}
            style={{ fontSize: "var(--font-size-sm)", borderRadius: 8, marginBottom: "0.75rem" }}
          >
            {linkError}
          </Alert>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>Google</span>
          </div>
          {isGoogleLinked ? (
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-success)", fontWeight: 600 }}>
              ✓ Connected
            </span>
          ) : (
            <Button size="sm" variant="outline-secondary" onClick={handleLinkGoogle} disabled={linkLoading}>
              {linkLoading ? "Redirecting\u2026" : "Link account"}
            </Button>
          )}
        </div>
      </div>

      {/* Auth info */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Authentication</div>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
          {isGoogleLinked && hasPasswordLogin
            ? "Email + Google"
            : isGoogleLinked
            ? "Google"
            : "Email / Password"}
        </div>
        <Button variant="outline-danger" size="sm" onClick={signOut} style={{ borderRadius: 6, fontWeight: 600 }}>
          Sign out
        </Button>
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
