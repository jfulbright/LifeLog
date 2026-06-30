import React from "react";
import { Modal, Button } from "react-bootstrap";

/**
 * "Hidden, not deleted" confirmation (Epic B / B3). Used when removing a person
 * or leaving a collaboration — both are reversible soft-hides, never deletes.
 */
function ConfirmHideModal({ show, name, onConfirm, onCancel, busy = false }) {
  const who = name || "this person";
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
          Remove {who}?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
        Your shared trips, collaborations, and recommendations with{" "}
        <strong style={{ color: "var(--color-text-primary)" }}>{who}</strong> will be{" "}
        <strong style={{ color: "var(--color-text-primary)" }}>hidden for both of you</strong> —
        not deleted. You can add them back anytime to restore everything.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="link" onClick={onCancel} disabled={busy} style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Removing…" : "Remove"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmHideModal;
