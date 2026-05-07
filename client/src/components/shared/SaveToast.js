import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";

/**
 * Fixed-position toast notification for save confirmations.
 * Auto-dismisses after 3 seconds.
 */
function SaveToast({ show, onClose, message = "Saved ✅" }) {
  return (
    <ToastContainer className="toast-container-fixed">
      <Toast
        show={show}
        onClose={onClose}
        delay={3000}
        autohide
        style={{
          background: "var(--color-primary)",
          border: "none",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(74, 21, 75, 0.35)",
        }}
      >
        <Toast.Body
          className="text-white d-flex align-items-center gap-2"
          style={{ fontWeight: 600, fontSize: "0.9rem", padding: "0.625rem 1rem" }}
        >
          {message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}

export default SaveToast;
