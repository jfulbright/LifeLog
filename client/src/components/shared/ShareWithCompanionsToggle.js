import React from "react";
import { useAppData } from "../../contexts/AppDataContext";

/**
 * ShareWithCompanionsToggle — renders inline after the companions picker
 * when at least one named contact has been added.
 *
 * Each contact companion gets an ON/OFF toggle:
 *   ON  → their contactId is added to shareWithCompanionIds in formData
 *         (useCategory.handleSubmit turns this into a pending entryTag)
 *   OFF → private log only; nothing is pushed to their LifeLog
 *
 * Contacts without a linkedUserId are shown but labeled "Not on LifeLog yet"
 * — toggling them still creates a pending entryTag that activates when they join.
 */
function ShareWithCompanionsToggle({ companions, value, onChange }) {
  const { contacts } = useAppData();

  const contactCompanions = companions.filter((c) => c.type === "contact");
  if (contactCompanions.length === 0) return null;

  const toggle = (contactId) => {
    const next = value.includes(contactId)
      ? value.filter((id) => id !== contactId)
      : [...value, contactId];
    onChange(next);
  };

  const sharedCount = value.length;

  return (
    <div className="share-companions-toggle-wrapper">
      <div className="share-companions-header">
        <span className="share-companions-icon" aria-hidden="true">
          {sharedCount > 0 ? "🤝" : "👤"}
        </span>
        <span className="share-companions-heading">
          Share & Collaborate
        </span>
      </div>

      <div className="share-companions-hint">
        Sharing invites them to collaborate — they'll see this in their timeline and can add their own memories and photos. Without sharing, you're just noting they were there.
      </div>

      <div className="share-companions-list">
        {contactCompanions.map((companion) => {
          const contact = contacts.find((c) => c.id === companion.contactId);
          const isLinked = !!contact?.linkedUserId;
          const isShared = value.includes(companion.contactId);

          return (
            <div key={companion.contactId} className="share-companion-row">
              <div className="share-companion-identity">
                <span className="share-companion-name">
                  {companion.displayName}
                </span>
                {!isLinked && (
                  <span className="share-companion-status">
                    Not on LifeLog yet — will notify when they join
                  </span>
                )}
              </div>
              <div className="form-check form-switch mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id={`share-companion-${companion.contactId}`}
                  checked={isShared}
                  onChange={() => toggle(companion.contactId)}
                  aria-label={`Share with ${companion.displayName}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ShareWithCompanionsToggle;
