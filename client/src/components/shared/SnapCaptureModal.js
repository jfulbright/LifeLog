import React, { useState, useRef, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";

const SNAP_FIELDS = [
  {
    key: "snapshot1",
    prompt: "Snapshot 1",
    placeholder: "Add a quick memory\u2026",
  },
  {
    key: "snapshot2",
    prompt: "Snapshot 2",
    placeholder: "Add a quick memory\u2026",
  },
  {
    key: "snapshot3",
    prompt: "Snapshot 3",
    placeholder: "Add a quick memory\u2026",
  },
];

const MAX_LENGTH = 140;
const CIRCLE_RADIUS = 16;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

function CharRing({ length }) {
  const pct = Math.min(length / MAX_LENGTH, 1);
  const offset = CIRCLE_CIRCUMFERENCE * (1 - pct);
  const isNear = length > MAX_LENGTH * 0.85;

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle
        cx="20" cy="20" r={CIRCLE_RADIUS}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="3"
      />
      <circle
        cx="20" cy="20" r={CIRCLE_RADIUS}
        fill="none"
        stroke={isNear ? "var(--color-warning)" : "var(--color-primary)"}
        strokeWidth="3"
        strokeDasharray={CIRCLE_CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        style={{ transition: "stroke-dashoffset 150ms ease, stroke 150ms ease" }}
      />
      <text
        x="20" y="21"
        textAnchor="middle"
        dominantBaseline="central"
        fill={isNear ? "var(--color-warning)" : "var(--color-text-tertiary)"}
        fontSize="9"
        fontWeight="600"
      >
        {MAX_LENGTH - length}
      </text>
    </svg>
  );
}

function SnapCaptureModal({ show, onClose, onSave, itemTitle }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(["", "", ""]);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (show) {
      setStep(0);
      setValues(["", "", ""]);
    }
  }, [show]);

  useEffect(() => {
    if (show && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [show, step]);

  const current = SNAP_FIELDS[step];
  const currentValue = values[step];

  const handleChange = (e) => {
    const val = e.target.value.slice(0, MAX_LENGTH);
    setValues((prev) => {
      const next = [...prev];
      next[step] = val;
      return next;
    });
  };

  const handleNext = () => {
    if (step < SNAP_FIELDS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    const snapData = {};
    SNAP_FIELDS.forEach((f, i) => {
      if (values[i].trim()) snapData[f.key] = values[i].trim();
    });
    onSave(snapData);
  };

  const handleSkip = () => {
    if (step < SNAP_FIELDS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const filledCount = values.filter((v) => v.trim()).length;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      className="snap-capture-modal"
      backdrop="static"
    >
      <Modal.Body className="snap-capture-body">
        <div className="snap-capture-header">
          <span className="snap-capture-sparkle" aria-hidden="true">&#10024;</span>
          <div className="snap-capture-heading">
            Capture a snapshot
          </div>
          {itemTitle && (
            <div className="snap-capture-item-title">{itemTitle}</div>
          )}
        </div>

        <div className="snap-capture-progress">
          {SNAP_FIELDS.map((_, i) => (
            <div
              key={i}
              className={`snap-capture-dot ${i === step ? "active" : ""} ${values[i].trim() ? "filled" : ""}`}
            />
          ))}
        </div>

        <div className="snap-capture-prompt">{current.prompt}</div>

        <div className="snap-capture-input-wrap">
          <textarea
            ref={textareaRef}
            className="snap-capture-textarea"
            placeholder={current.placeholder}
            value={currentValue}
            onChange={handleChange}
            maxLength={MAX_LENGTH}
            rows={4}
          />
          <div className="snap-capture-counter">
            <CharRing length={currentValue.length} />
          </div>
        </div>

        <div className="snap-capture-actions">
          <Button variant="link" className="text-muted" onClick={handleSkip}>
            {step < SNAP_FIELDS.length - 1 ? "Skip" : (filledCount === 0 ? "Skip all" : "Finish")}
          </Button>
          <Button variant="primary" onClick={handleNext}>
            {step < SNAP_FIELDS.length - 1 ? "Next" : "Save snapshots"}
          </Button>
        </div>

        <button
          type="button"
          className="snap-capture-dismiss"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      </Modal.Body>
    </Modal>
  );
}

export default SnapCaptureModal;
