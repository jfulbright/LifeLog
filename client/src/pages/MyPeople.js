import React, { useState, useCallback, useEffect } from "react";
import { Button, Form, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import contactsService from "../services/contactsService";
import inviteService from "../services/inviteService";
import FormPanel from "../components/shared/FormPanel";
import ConnectionRequests from "../components/shared/ConnectionRequests";
import ConfirmHideModal from "../components/shared/ConfirmHideModal";
import { RING_META, RING_LEVELS } from "../helpers/ringMeta";

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

function ContactForm({ initial = {}, onSave, onDelete, onCancel, isEditing }) {
  const [email, setEmail] = useState(initial.email || "");
  const [firstName, setFirstName] = useState(initial.firstName || "");
  const [lastName, setLastName] = useState(initial.lastName || "");
  const [displayName, setDisplayName] = useState(initial.displayName || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [ringLevel, setRingLevel] = useState(initial.ringLevel || 4);
  const [isChild, setIsChild] = useState(initial.isChild || false);
  const [birthday, setBirthday] = useState(initial.birthday || "");
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
    if (!displayName.trim() && !firstName.trim()) return setError("Name or display name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Please enter a valid email address.");
    }
    const resolvedDisplay = displayName.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();
    setSaving(true);
    try {
      await onSave({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: resolvedDisplay,
        phone: phone.trim(),
        ringLevel,
        isChild,
        birthday: birthday || null,
      });
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

      <div className="row g-2 mb-3">
        <div className="col-6">
          <Form.Label htmlFor="contact-first">First Name</Form.Label>
          <Form.Control
            id="contact-first"
            type="text"
            placeholder="First"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="col-6">
          <Form.Label htmlFor="contact-last">Last Name</Form.Label>
          <Form.Control
            id="contact-last"
            type="text"
            placeholder="Last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="contact-name">
          Display Name (nickname)
        </Form.Label>
        <Form.Control
          id="contact-name"
          type="text"
          placeholder="How you refer to them (e.g. Wifey, Mom)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Form.Text className="text-muted">
          If blank, first + last name will be used.
        </Form.Text>
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

      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          id="contact-is-child"
          label="This is my child"
          checked={isChild}
          onChange={(e) => setIsChild(e.target.checked)}
        />
        <Form.Text className="text-muted">
          Enables milestone timeline and age-at-event tracking.
        </Form.Text>
      </Form.Group>

      {isChild && (
        <Form.Group className="mb-3">
          <Form.Label htmlFor="contact-birthday">Birthday</Form.Label>
          <Form.Control
            id="contact-birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          <Form.Text className="text-muted">
            Used to auto-calculate age at the time of milestone events.
          </Form.Text>
        </Form.Group>
      )}

      <div className="d-flex gap-2 mt-4">
        <Button variant="primary" type="submit" className="flex-grow-1" disabled={saving}>
          {saving ? "Saving\u2026" : isEditing ? "Update Contact" : "Add to My People"}
        </Button>
        {onCancel && (
          <Button variant="outline-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
      </div>

      {isEditing && onDelete && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <Button variant="outline-danger" size="sm" onClick={onDelete} className="w-100">
            Remove from My People
          </Button>
        </div>
      )}
    </Form>
  );
}

function ContactCard({ contact, onEdit, onInvite, onViewProfile }) {
  const ring = RING_META[contact.ringLevel];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--card-radius, 8px)",
        width: "100%",
        marginBottom: "0.5rem",
      }}
    >
      <button
        type="button"
        onClick={() => contact.linkedUserId ? onViewProfile(contact) : onEdit(contact)}
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
          <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
            {contact.displayName}
            {contact.isChild && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#FF6B35", background: "#FFF3ED", border: "1px solid #FFD0B5", borderRadius: 8, padding: "0.05rem 0.4rem" }}>
                child
              </span>
            )}
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
        {contact.linkedUserId ? (
          <span style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: "var(--color-success, #2EB67D)",
            background: "#EAFAF4",
            border: "1px solid #B7E8D5",
            borderRadius: 10,
            padding: "0.2rem 0.6rem",
            whiteSpace: "nowrap",
          }}>
            ✓ On LifeSnaps
          </span>
        ) : contact.inviteStatus === "invited" ? (
          <span style={{ fontSize: "0.65rem", color: "#ECB22E", fontWeight: 600 }}>
            ◐ Invited
          </span>
        ) : (
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
      </div>
    </div>
  );
}

function RingSection({ ringLevel, contacts, onEdit, onInvite, onViewProfile }) {
  const meta = RING_META[ringLevel];
  const ringContacts = contacts.filter((c) => c.ringLevel === ringLevel);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
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
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: 500 }}>
          {ringContacts.length > 0 ? `(${ringContacts.length})` : "\u2014 empty"}
        </span>
      </div>

      {ringContacts.length === 0 ? (
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)", fontStyle: "italic", padding: "0.5rem 0" }}>
          No one in your {meta.label} yet.
        </div>
      ) : (
        ringContacts.map((c) => (
          <ContactCard key={c.id} contact={c} onEdit={onEdit} onInvite={onInvite} onViewProfile={onViewProfile} />
        ))
      )}
    </div>
  );
}

function MyPeople() {
  const { contacts, refreshContacts } = useAppData();
  const navigate = useNavigate();
  const [showPanel, setShowPanel] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [inviteToast, setInviteToast] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [removedContacts, setRemovedContacts] = useState([]);

  const loadRemoved = useCallback(() => {
    contactsService.getRemovedContacts().then(setRemovedContacts).catch(() => setRemovedContacts([]));
  }, []);

  useEffect(() => {
    loadRemoved();
    const handler = () => loadRemoved();
    window.addEventListener("data-changed", handler);
    return () => window.removeEventListener("data-changed", handler);
  }, [loadRemoved]);

  const handleAdd = () => { setEditContact(null); setShowPanel(true); };
  const handleEdit = (contact) => { setEditContact(contact); setShowPanel(true); };
  const handleClose = () => { setShowPanel(false); setEditContact(null); };
  const handleViewProfile = (contact) => {
    // Linked people get the full ProfileView; unlinked contacts keep the
    // lite ContactProfile ("not on LifeSnaps") fallback.
    if (contact.linkedUserId) navigate(`/u/${contact.linkedUserId}`);
    else navigate(`/people/${contact.id}`);
  };

  const handleSave = useCallback(async (data) => {
    if (editContact) {
      await contactsService.updateContact(editContact.id, data);
    } else {
      await contactsService.addContact(data);
    }
    await refreshContacts();
    window.dispatchEvent(new Event("data-changed"));
    handleClose();
  }, [editContact, refreshContacts]);

  // Removing a person is a reversible soft-hide (B3). Open the warning modal
  // instead of hard-deleting; actual removal runs in confirmRemove.
  const handleDelete = useCallback(() => {
    if (!editContact) return;
    setRemoveTarget(editContact);
    setShowPanel(false);
  }, [editContact]);

  const confirmRemove = useCallback(async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await contactsService.removePerson(removeTarget);
      await refreshContacts();
      loadRemoved();
    } catch (err) {
      console.error("[MyPeople] removePerson failed:", err);
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
      setEditContact(null);
    }
  }, [removeTarget, refreshContacts, loadRemoved]);

  const handleAddBack = useCallback(async (contact) => {
    try {
      await contactsService.restorePerson(contact);
      await refreshContacts();
      loadRemoved();
    } catch (err) {
      console.error("[MyPeople] restorePerson failed:", err);
    }
  }, [refreshContacts, loadRemoved]);

  const handleInvite = useCallback(async (contact) => {
    try {
      const invite = await inviteService.createInvite({
        inviteeEmail: contact.email,
        inviteeName: contact.displayName,
      });
      const url = inviteService.getInviteUrl(invite.token);
      await contactsService.updateContact(contact.id, { inviteStatus: "invited" });
      await refreshContacts();
      await navigator.clipboard.writeText(url);
      setInviteToast(`Invite link copied! Share it with ${contact.displayName}.`);
      setTimeout(() => setInviteToast(null), 4000);
    } catch (err) {
      console.error("[MyPeople] invite failed:", err);
      setInviteToast("Failed to create invite. Try again.");
      setTimeout(() => setInviteToast(null), 4000);
    }
  }, [refreshContacts]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-0" style={{ fontWeight: 700 }}>My People</h4>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
            The people you share life with. Tap to edit, or invite them to join LifeSnaps.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAdd} style={{ whiteSpace: "nowrap" }}>
          + Add Person
        </Button>
      </div>

      <ConnectionRequests onChange={refreshContacts} />

      <div
        style={{
          background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--card-radius, 8px)",
          padding: "0.875rem 1rem",
          marginBottom: "1.5rem",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
        }}
      >
        <strong style={{ color: "var(--color-text-primary)" }}>How rings work:</strong> Adding someone to a ring determines who sees entries you share. They are notified only when you invite them or tag them on a specific entry.
      </div>

      {contacts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            👥
          </div>
          <div className="empty-state-title">No people yet</div>
          <div className="empty-state-text">
            Add the people you share life moments with -- family, friends, your inner circle.
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
            onViewProfile={handleViewProfile}
          />
        ))
      )}

      {removedContacts.length > 0 && (
        <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "var(--font-size-xs, 0.75rem)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
            Removed people
          </div>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: "0 0 0.75rem" }}>
            Hidden, not deleted. Add anyone back to restore your shared trips and recommendations.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {removedContacts.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                  <ContactAvatar displayName={c.displayName} ringLevel={c.ringLevel} size={32} />
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.displayName || c.email}
                  </span>
                </span>
                <Button variant="outline-primary" size="sm" onClick={() => handleAddBack(c)} style={{ whiteSpace: "nowrap" }}>
                  Add back
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmHideModal
        show={!!removeTarget}
        name={removeTarget?.displayName}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
        busy={removing}
      />

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
    </>
  );
}

export default MyPeople;
