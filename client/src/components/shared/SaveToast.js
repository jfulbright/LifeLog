import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";

/**
 * Fixed-position toast notification for save confirmations.
 * Auto-dismisses after 3 seconds.
 */
function SaveToast({ show, onClose, message = "Saved successfully" }) {
  return (
    <ToastContainer className="toast-container-fixed">
      <Toast
        show={show}
        onClose={onClose}
        delay={3000}
        autohide
        bg="dark"
      >
        <Toast.Body className="text-white d-flex align-items-center gap-2">
          <span style={{ color: "var(--color-success)" }}>&#10003;</span>
          {message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default SaveToast;
