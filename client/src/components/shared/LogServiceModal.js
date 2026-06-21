import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

// Quick-log a maintenance service. The hero interaction: log an oil change in
// seconds. Type options are seeded from the adopted plan, plus generic
// ad-hoc entries (Repair / Issue / Other) for things that aren't scheduled.
const EXTRA_TYPES = ["Repair", "Issue / Problem", "Other"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function LogServiceModal({
  show,
  onClose,
  onSave,
  planTypes = [],
  tracksMileage = false,
  defaultMileage = null,
}) {
  const typeOptions = [...planTypes, ...EXTRA_TYPES];
  const [type, setType] = useState(typeOptions[0] || "Other");
  const [customType, setCustomType] = useState("");
  const [date, setDate] = useState(todayISO());
  const [mileage, setMileage] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  // Reset to a clean slate each time the modal opens.
  useEffect(() => {
    if (show) {
      setType(typeOptions[0] || "Other");
      setCustomType("");
      setDate(todayISO());
      setMileage(defaultMileage ? String(defaultMileage) : "");
      setCost("");
      setNotes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const isCustom = type === "Other";
  const resolvedType = isCustom ? customType.trim() : type;
  const canSave = resolvedType.length > 0 && !!date;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      type: resolvedType,
      date,
      mileage: tracksMileage && mileage ? Number(mileage) : null,
      cost: cost ? Number(cost) : null,
      notes: notes.trim(),
    });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            🔧 Log Service
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Service</Form.Label>
            <Form.Select value={type} onChange={(e) => setType(e.target.value)} autoFocus>
              {typeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Form.Select>
          </Form.Group>

          {isCustom && (
            <Form.Group className="mb-3">
              <Form.Label>Describe the service</Form.Label>
              <Form.Control
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g. Coolant flush"
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} />
          </Form.Group>

          {tracksMileage && (
            <Form.Group className="mb-3">
              <Form.Label>Mileage</Form.Label>
              <Form.Control
                type="number"
                inputMode="numeric"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="e.g. 48210"
              />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Cost (optional)</Form.Label>
            <Form.Control
              type="number"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="$0.00"
            />
          </Form.Group>

          <Form.Group className="mb-0">
            <Form.Label>Notes (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mobil 1 synthetic, rotated tires too"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="link" className="text-muted" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={!canSave}>Log Service</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default LogServiceModal;
