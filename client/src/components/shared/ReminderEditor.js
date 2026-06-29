import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

// Modify a reminder schedule: mileage interval (vehicles), time interval, and
// whether the reminder is active at all. Opened from a "Modify" suggestion or
// to edit an existing scheduled item.
function ReminderEditor({
  show,
  onClose,
  onSave,
  type,
  tracksMileage = false,
  initial = {},
}) {
  const [miles, setMiles] = useState("");
  const [months, setMonths] = useState("");
  const [reminderOn, setReminderOn] = useState(true);

  useEffect(() => {
    if (show) {
      setMiles(initial.intervalMiles != null ? String(initial.intervalMiles) : "");
      setMonths(initial.intervalMonths != null ? String(initial.intervalMonths) : "");
      setReminderOn(initial.reminderOn !== false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      intervalMiles: tracksMileage && miles ? Number(miles) : null,
      intervalMonths: months ? Number(months) : null,
      reminderOn,
    });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1.05rem", fontWeight: 700 }}>
            ⏰ {type} reminder
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Check
            type="switch"
            id="reminder-on"
            className="mb-3"
            label="Remind me when this is due"
            checked={reminderOn}
            onChange={(e) => setReminderOn(e.target.checked)}
          />

          {tracksMileage && (
            <Form.Group className="mb-3">
              <Form.Label>Every (miles)</Form.Label>
              <Form.Control
                type="number"
                inputMode="numeric"
                value={miles}
                onChange={(e) => setMiles(e.target.value)}
                placeholder="e.g. 5000"
                disabled={!reminderOn}
              />
            </Form.Group>
          )}

          <Form.Group className="mb-0">
            <Form.Label>Every (months)</Form.Label>
            <Form.Control
              type="number"
              inputMode="numeric"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="e.g. 6"
              disabled={!reminderOn}
            />
            <Form.Text className="text-muted">
              Whichever comes first triggers the reminder.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="link" className="text-muted" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit">Save reminder</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ReminderEditor;
