import React from "react";
import { Modal, Button } from "react-bootstrap";

/**
 * "Hidden, not deleted" confirmation (Epic B / B3). Used when removing a person
 * or leaving a collaboration — both are reversible soft-hides, never deletes.
 */
function ConfirmHideModal({ show, name, onConfirm, onCancel, busy = false, title, body, confirmLabel, busyLabel }) {
  const who = name || "this person";
  const resolvedTitle = title || `Remove ${who}?`;
  const resolvedBody = body || (
    <>
      Your shared trips, collaborations, and recommendations with{" "}
      <strong style={{ color: "var(--color-text-primary)" }}>{who}</strong> will be{" "}
      <strong style={{ color: "var(--color-text-primary)" }}>hidden for both of you</strong> —
      not deleted. You can add them back anytime to restore everything.
    </>
  );
  const resolvedConfirm = confirmLabel || "Remove";
  const resolvedBusy = busyLabel || "Removing…";
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
          {resolvedTitle}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
        {resolvedBody}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="link" onClick={onCancel} disabled={busy} style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? resolvedBusy : resolvedConfirm}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmHideModal;
