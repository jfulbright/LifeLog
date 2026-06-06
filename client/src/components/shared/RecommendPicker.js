import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { useAppData } from "../../contexts/AppDataContext";
import { RING_META } from "../../helpers/ringMeta";
import PeopleListSearch from "./PeopleListSearch";

function RecommendPicker({ formData, setFormData }) {
  const { contacts } = useAppData();
  const [showModal, setShowModal] = useState(false);

  const recommendedToRings = formData.recommendedToRings || [];
  const recommendedToContacts = formData.recommendedToContacts || [];
  const hasRecommendation = recommendedToRings.length > 0 || recommendedToContacts.length > 0;

  const toggleRing = (ringLevel) => {
    const next = recommendedToRings.includes(ringLevel)
      ? recommendedToRings.filter((r) => r !== ringLevel)
      : [...recommendedToRings, ringLevel];
    setFormData((prev) => ({ ...prev, recommendedToRings: next }));
  };

  const toggleContact = (contactId) => {
    const next = recommendedToContacts.includes(contactId)
      ? recommendedToContacts.filter((id) => id !== contactId)
      : [...recommendedToContacts, contactId];
    setFormData((prev) => ({ ...prev, recommendedToContacts: next }));
  };

  const summaryText = () => {
    const parts = [];
    const names = recommendedToContacts
      .map((id) => contacts.find((c) => c.id === id)?.displayName)
      .filter(Boolean);
    if (names.length > 0) {
      parts.push(names.length <= 2 ? names.join(", ") : `${names[0]} + ${names.length - 1} more`);
    }
    const ringLabels = recommendedToRings.map((r) => RING_META[r]?.label).filter(Boolean);
    if (ringLabels.length > 0) parts.push(ringLabels.join(", "));
    return parts.join(" · ");
  };

  return (
    <div className="share-with-section">
      <button
        type="button"
        className="share-with-toggle"
        onClick={() => setShowModal(true)}
      >
        <span className="share-with-toggle-icon">{hasRecommendation ? "⭐" : "☆"}</span>
        <span className="share-with-toggle-label">
          {hasRecommendation ? `Recommending to ${summaryText()}` : "Recommend to my People"}
        </span>
        <span className="share-with-toggle-chevron" style={{ marginLeft: "auto" }}>▼</span>
      </button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: "1rem", fontWeight: 700 }}>
            Recommend to my People
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
            Who should check this out? They'll see it as a recommendation in their feed.
          </div>
          <PeopleListSearch
            selectedContacts={recommendedToContacts}
            selectedRings={recommendedToRings}
            onContactToggle={toggleContact}
            onRingToggle={toggleRing}
            showRings={true}
            showContacts={true}
            placeholder="Search people to recommend to…"
          />
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(false)}
          >
            Done
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default RecommendPicker;
