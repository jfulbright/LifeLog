import React, { useRef } from "react";
import { Offcanvas } from "react-bootstrap";

function FormPanel({ show, onHide, title, children }) {
  const bodyRef = useRef(null);

  const handleEntered = () => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
      const firstInput = bodyRef.current.querySelector(
        "input:not([type=hidden]), select, textarea, [role=combobox]"
      );
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
      }
    }
  };

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      onEntered={handleEntered}
      placement="end"
      className="form-panel"
      style={{ width: "min(480px, 100%)" }}
    >
      <Offcanvas.Header closeButton className="form-panel-header">
        <Offcanvas.Title style={{ fontWeight: 600 }}>{title}</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body ref={bodyRef}>{children}</Offcanvas.Body>
    </Offcanvas>
  );
}

export default FormPanel;
