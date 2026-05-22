import React, { useState, useRef, useEffect } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import { RING_META, RING_LEVELS } from "../../helpers/ringMeta";

function ContactInitialBadge({ name, color = "#9E9E9E", size = 28 }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function RingChip({ level, onRemove }) {
  const meta = RING_META[level];
  if (!meta) return null;
  return (
    <span
      className="companion-chip companion-chip--contact"
      style={{ borderColor: meta.color, background: meta.bgColor }}
    >
      <span
        className="companion-chip-dot"
        style={{ background: meta.color }}
        aria-hidden="true"
      />
      {meta.emoji} {meta.label}
      {onRemove && (
        <button
          type="button"
          className="companion-chip-remove"
          onClick={onRemove}
          aria-label={`Remove ${meta.label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

function ContactChip({ contact, onRemove }) {
  const ring = contact ? RING_META[contact.ringLevel] : null;
  const name = contact?.displayName || "?";
  return (
    <span
      className="companion-chip companion-chip--contact"
      style={{
        borderColor: ring ? ring.color : "var(--color-border)",
        background: ring ? ring.bgColor : "var(--color-surface-hover)",
      }}
    >
      <span
        className="companion-chip-dot"
        style={{ background: ring ? ring.color : "#9E9E9E" }}
        aria-hidden="true"
      />
      {name}
      {onRemove && (
        <button
          type="button"
          className="companion-chip-remove"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

/**
 * PeopleField — unified chip-input + dropdown for companions, recommendations, and visibility.
 *
 * mode="companions"  → writes formData.companions[] (contact objects + freetext)
 * mode="recommend"   → writes formData.recommendedToRings[] + formData.recommendedToContacts[]
 * mode="visibility"  → writes formData.visibilityRings[]
 */
function PeopleField({ mode, formData, setFormData, placeholder }) {
  const { contacts } = useAppData();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (dropdownOpen && containerRef.current) {
      setTimeout(() => {
        const wrapperRect = containerRef.current.getBoundingClientRect();
        const dropdownBottom = wrapperRect.bottom + 4 + 320;
        const overflow = dropdownBottom - window.innerHeight;
        if (overflow > 0) {
          window.scrollBy({ top: overflow + 20, behavior: "smooth" });
        }
      }, 50);
    }
  }, [dropdownOpen]);

  const selectedContactIds = getSelectedContactIds();
  const selectedRings = getSelectedRings();

  const filteredContacts = normalizedQuery
    ? contacts.filter(
        (c) =>
          !selectedContactIds.includes(c.id) &&
          (c.displayName.toLowerCase().includes(normalizedQuery) ||
            c.email.toLowerCase().includes(normalizedQuery))
      )
    : contacts.filter((c) => !selectedContactIds.includes(c.id));

  const topContacts = filteredContacts.slice(0, 3);
  const remainingContacts = filteredContacts.slice(3);
  const showDropdown = dropdownOpen;

  function getSelectedContactIds() {
    if (mode === "companions") {
      const companions = normalizeCompanions(formData.companions || []);
      return companions
        .filter((c) => c.type === "contact")
        .map((c) => c.contactId);
    }
    if (mode === "recommend") {
      return formData.recommendedToContacts || [];
    }
    return [];
  }

  function getSelectedRings() {
    if (mode === "companions") {
      const companions = normalizeCompanions(formData.companions || []);
      const contactIds = new Set(companions.filter((c) => c.type === "contact").map((c) => c.contactId));
      return RING_LEVELS.filter((level) => {
        const ringContacts = contacts.filter((c) => c.ringLevel === level);
        return ringContacts.length > 0 && ringContacts.every((c) => contactIds.has(c.id));
      });
    }
    if (mode === "recommend") return formData.recommendedToRings || [];
    if (mode === "visibility") return formData.visibilityRings || [];
    return [];
  }

  function getPlaceholder() {
    if (placeholder) return placeholder;
    if (mode === "companions") return "Add from your people or type a name";
    if (mode === "recommend") return "Recommend to people or rings…";
    return "Private — select rings to share";
  }

  function hasSelections() {
    if (mode === "companions") {
      return (formData.companions || []).length > 0;
    }
    if (mode === "recommend") {
      return (
        (formData.recommendedToRings || []).length > 0 ||
        (formData.recommendedToContacts || []).length > 0
      );
    }
    return (formData.visibilityRings || []).length > 0;
  }

  function addContact(contact) {
    if (mode === "companions") {
      const companions = normalizeCompanions(formData.companions || []);
      setFormData((prev) => ({
        ...prev,
        companions: [
          ...companions,
          { type: "contact", contactId: contact.id, displayName: contact.displayName },
        ],
      }));
    } else if (mode === "recommend") {
      const current = formData.recommendedToContacts || [];
      if (!current.includes(contact.id)) {
        setFormData((prev) => ({
          ...prev,
          recommendedToContacts: [...current, contact.id],
        }));
      }
    }
    setQuery("");
    inputRef.current?.focus();
  }

  function removeContact(contactId) {
    if (mode === "companions") {
      const companions = normalizeCompanions(formData.companions || []);
      setFormData((prev) => ({
        ...prev,
        companions: companions.filter(
          (c) => !(c.type === "contact" && c.contactId === contactId)
        ),
      }));
    } else if (mode === "recommend") {
      setFormData((prev) => ({
        ...prev,
        recommendedToContacts: (prev.recommendedToContacts || []).filter(
          (id) => id !== contactId
        ),
      }));
    }
  }

  function addFreetext(name) {
    if (mode !== "companions") return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const companions = normalizeCompanions(formData.companions || []);
    const alreadyExists = companions.find(
      (v) => v.type === "freetext" && v.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!alreadyExists) {
      setFormData((prev) => ({
        ...prev,
        companions: [...companions, { type: "freetext", name: trimmed }],
      }));
    }
    setQuery("");
    inputRef.current?.focus();
  }

  function removeFreetext(name) {
    const companions = normalizeCompanions(formData.companions || []);
    setFormData((prev) => ({
      ...prev,
      companions: companions.filter(
        (c) => !(c.type === "freetext" && c.name === name)
      ),
    }));
  }

  function toggleRing(level) {
    if (mode === "companions") {
      const ringContacts = contacts.filter((c) => c.ringLevel === level);
      const companions = normalizeCompanions(formData.companions || []);
      const currentContactIds = companions.filter((c) => c.type === "contact").map((c) => c.contactId);
      const allInRingSelected = ringContacts.length > 0 && ringContacts.every((c) => currentContactIds.includes(c.id));

      if (allInRingSelected) {
        const ringIds = new Set(ringContacts.map((c) => c.id));
        setFormData((prev) => ({
          ...prev,
          companions: companions.filter((c) => !(c.type === "contact" && ringIds.has(c.contactId))),
        }));
      } else {
        const toAdd = ringContacts
          .filter((c) => !currentContactIds.includes(c.id))
          .map((c) => ({ type: "contact", contactId: c.id, displayName: c.displayName }));
        setFormData((prev) => ({
          ...prev,
          companions: [...companions, ...toAdd],
        }));
      }
    } else if (mode === "recommend") {
      const current = formData.recommendedToRings || [];
      const next = current.includes(level)
        ? current.filter((r) => r !== level)
        : [...current, level];
      setFormData((prev) => ({ ...prev, recommendedToRings: next }));
    } else if (mode === "visibility") {
      const current = formData.visibilityRings || [];
      const next = current.includes(level)
        ? current.filter((r) => r !== level)
        : [...current, level];
      setFormData((prev) => ({ ...prev, visibilityRings: next }));
    }
  }

  function removeRing(level) {
    toggleRing(level);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredContacts.length === 1 && normalizedQuery) {
        addContact(filteredContacts[0]);
      } else if (normalizedQuery && mode === "companions") {
        addFreetext(query);
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    } else if (e.key === "Backspace" && !query) {
      removeLastChip();
    }
  }

  function removeLastChip() {
    if (mode === "companions") {
      const companions = normalizeCompanions(formData.companions || []);
      if (companions.length > 0) {
        setFormData((prev) => ({
          ...prev,
          companions: companions.slice(0, -1),
        }));
      }
    } else if (mode === "recommend") {
      const contactIds = formData.recommendedToContacts || [];
      const rings = formData.recommendedToRings || [];
      if (contactIds.length > 0) {
        setFormData((prev) => ({
          ...prev,
          recommendedToContacts: contactIds.slice(0, -1),
        }));
      } else if (rings.length > 0) {
        setFormData((prev) => ({
          ...prev,
          recommendedToRings: rings.slice(0, -1),
        }));
      }
    } else if (mode === "visibility") {
      const rings = formData.visibilityRings || [];
      if (rings.length > 0) {
        setFormData((prev) => ({
          ...prev,
          visibilityRings: rings.slice(0, -1),
        }));
      }
    }
  }

  function renderChips() {
    const chips = [];

    if (mode === "companions") {
      const companions = normalizeCompanions(formData.companions || []);
      companions.forEach((entry, i) => {
        if (entry.type === "contact") {
          const contact = contacts.find((c) => c.id === entry.contactId);
          chips.push(
            <ContactChip
              key={`contact-${entry.contactId}`}
              contact={contact || { displayName: entry.displayName }}
              onRemove={() => removeContact(entry.contactId)}
            />
          );
        } else {
          chips.push(
            <span key={`freetext-${i}`} className="companion-chip companion-chip--guest">
              {entry.name}
              <button
                type="button"
                className="companion-chip-remove"
                onClick={() => removeFreetext(entry.name)}
                aria-label={`Remove ${entry.name}`}
              >
                ×
              </button>
            </span>
          );
        }
      });
    } else if (mode === "recommend") {
      (formData.recommendedToRings || []).forEach((level) => {
        chips.push(
          <RingChip key={`ring-${level}`} level={level} onRemove={() => removeRing(level)} />
        );
      });
      (formData.recommendedToContacts || []).forEach((contactId) => {
        const contact = contacts.find((c) => c.id === contactId);
        chips.push(
          <ContactChip
            key={`contact-${contactId}`}
            contact={contact}
            onRemove={() => removeContact(contactId)}
          />
        );
      });
    } else if (mode === "visibility") {
      (formData.visibilityRings || []).forEach((level) => {
        chips.push(
          <RingChip key={`ring-${level}`} level={level} onRemove={() => removeRing(level)} />
        );
      });
    }

    return chips;
  }

  const chips = renderChips();
  const showRings = true;
  const showContacts = mode === "companions" || mode === "recommend";

  return (
    <div ref={containerRef} className="contact-picker-wrapper">
      <div
        className="contact-picker-input-area"
        onClick={() => inputRef.current?.focus()}
      >
        {chips}
        <input
          ref={inputRef}
          type="text"
          className="contact-picker-text-input"
          placeholder={!hasSelections() ? getPlaceholder() : ""}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>

      {showDropdown && (
        <div ref={dropdownRef} className="contact-picker-dropdown people-field-dropdown">
          {showRings && (
            <div className="people-field-section">
              <div className="people-field-section-header">Select by Ring</div>
              <div className="people-field-rings">
                {RING_LEVELS.map((level) => {
                  const meta = RING_META[level];
                  const active = selectedRings.includes(level);
                  const count = contacts.filter((c) => c.ringLevel === level).length;
                  return (
                    <button
                      key={level}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggleRing(level);
                      }}
                      aria-pressed={active}
                      className="people-field-ring-btn"
                      style={{
                        background: active ? meta.color : "var(--color-surface)",
                        color: active ? "#fff" : "var(--color-text-secondary)",
                        borderColor: active ? meta.color : "var(--color-border)",
                      }}
                    >
                      {meta.emoji} {meta.label}
                      {count > 0 && (
                        <span className="people-field-ring-count" style={{
                          background: active ? "rgba(255,255,255,0.25)" : "var(--color-bg)",
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {showContacts && (
            <>
              {topContacts.length > 0 && (
                <div className="people-field-section">
                  {topContacts.map((contact) => {
                    const ring = RING_META[contact.ringLevel];
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        className="contact-picker-option"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addContact(contact);
                        }}
                      >
                        <ContactInitialBadge name={contact.displayName} color={ring?.color} size={28} />
                        <div className="contact-picker-option-info">
                          <span className="contact-picker-option-name">{contact.displayName}</span>
                          <span className="contact-picker-option-email">{contact.email}</span>
                        </div>
                        {ring && (
                          <span
                            className="contact-picker-ring-badge"
                            style={{ color: ring.color, background: ring.bgColor, borderColor: ring.borderColor }}
                          >
                            {ring.emoji}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {remainingContacts.length > 0 && (
                <div className="people-field-section">
                  {remainingContacts.slice(0, 10).map((contact) => {
                    const ring = RING_META[contact.ringLevel];
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        className="contact-picker-option"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addContact(contact);
                        }}
                      >
                        <ContactInitialBadge name={contact.displayName} color={ring?.color} size={28} />
                        <div className="contact-picker-option-info">
                          <span className="contact-picker-option-name">{contact.displayName}</span>
                          <span className="contact-picker-option-email">{contact.email}</span>
                        </div>
                        {ring && (
                          <span
                            className="contact-picker-ring-badge"
                            style={{ color: ring.color, background: ring.bgColor, borderColor: ring.borderColor }}
                          >
                            {ring.emoji}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {mode === "companions" && normalizedQuery && (
                <button
                  type="button"
                  className="contact-picker-option contact-picker-option--freetext"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addFreetext(query);
                  }}
                >
                  <span className="contact-picker-guest-icon">+</span>
                  <div className="contact-picker-option-info">
                    <span className="contact-picker-option-name">Add as guest: {query}</span>
                    <span className="contact-picker-option-email">Not linked to a contact</span>
                  </div>
                </button>
              )}

              {filteredContacts.length === 0 && !normalizedQuery && (
                <div className="contact-picker-empty">
                  {mode === "companions"
                    ? "No more contacts to add. Start typing to add someone as a guest."
                    : "No contacts available."}
                </div>
              )}
            </>
          )}

          {mode === "visibility" && !showContacts && filteredContacts.length === 0 && (
            <div className="contact-picker-empty" style={{ padding: "0.25rem 0.75rem", fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
              Select rings above to control visibility
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function normalizeCompanions(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (typeof entry === "string") return { type: "freetext", name: entry };
    return entry;
  });
}

export default PeopleField;
