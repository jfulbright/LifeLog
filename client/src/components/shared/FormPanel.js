import React from "react";
import { Offcanvas } from "react-bootstrap";

/**
 * Shared slide-in panel for forms.
 * Desktop: slides in from the right (480px wide).
 * Mobile: full-width overlay.
 * Each category List wraps its form component inside this.
 */
function FormPanel({ show, onHide, title, children }) {
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      className="form-panel"
      style={{ width: "min(480px, 100%)" }}
    >
      <Offcanvas.Header closeButton className="form-panel-header">
        <Offcanvas.Title style={{ fontWeight: 600 }}>{title}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>{children}</Offcanvas.Body>
    </Offcanvas>
  );
}

export default FormPanel;
