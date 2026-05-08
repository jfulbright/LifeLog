import React, { useState, useRef, useEffect } from "react";
import { useAppData } from "../../contexts/AppDataContext";
import { RING_META } from "../../helpers/ringMeta";

/**
 * ContactPicker — autocomplete chip input for the "Who I was with" field.
 *
 * Value format: array of companion objects:
 *   { type: "contact", contactId, displayName }   ← linked to a Contact record
 *   { type: "freetext", name }                    ← free-text (legacy or unlinked)
 *
 * Falls back to plain text entry for people not in your contacts list.
 */
function ContactPicker({ value = [], onChange, placeholder = "Add from your people or type a name", readOnly }) {
  const { contacts } = useAppData();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredContacts = normalizedQuery
    ? contacts.filter(
        (c) =>
          !value.find((v) => v.type === "contact" && v.contactId === c.id) &&
          (c.displayName.toLowerCase().includes(normalizedQuery) ||
            c.email.toLowerCase().includes(normalizedQuery))
      )
    : contacts.filter(
        (c) => !value.find((v) => v.type === "contact" && v.contactId === c.id)
      );

  const showDropdown = dropdownOpen && (filteredContacts.length > 0 || normalizedQuery.length > 0);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addContact = (contact) => {
    onChange([
      ...value,
      { type: "contact", contactId: contact.id, displayName: contact.displayName },
    ]);
    setQuery("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const addFreetext = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const alreadyExists = value.find(
      (v) => v.type === "freetext" && v.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (!alreadyExists) {
      onChange([...value, { type: "freetext", name: trimmed }]);
    }
    setQuery("");
    setDropdownOpen(false);
    inputRef.current?.focus();
  };

  const removeEntry = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredContacts.length === 1 && normalizedQuery) {
        addContact(filteredContacts[0]);
      } else if (normalizedQuery) {
        addFreetext(query);
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeEntry(value.length - 1);
    }
  };

  if (readOnly) {
    if (!value || value.length === 0) return null;
    return (
      <div className="contact-picker-chips-readonly">
        {value.map((entry, i) => (
          <CompanionChip key={i} entry={entry} contacts={contacts} />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="contact-picker-wrapper">
      <div
        className="contact-picker-input-area"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((entry, i) => (
          <CompanionChip
            key={i}
            entry={entry}
            contacts={contacts}
            onRemove={() => removeEntry(i)}
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          className="contact-picker-text-input"
          placeholder={value.length === 0 ? placeholder : ""}
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
        <div className="contact-picker-dropdown">
          {filteredContacts.length > 0 && (
            <>
              {filteredContacts.slice(0, 6).map((contact) => {
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
            </>
          )}

          {normalizedQuery && (
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
              No more contacts to add. Start typing to add someone as a guest.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

function CompanionChip({ entry, contacts, onRemove }) {
  if (entry.type === "contact") {
    const contact = contacts.find((c) => c.id === entry.contactId);
    const ring = contact ? RING_META[contact.ringLevel] : null;
    const name = entry.displayName || (contact ? contact.displayName : "?");
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

  const name = entry.name || "";
  return (
    <span className="companion-chip companion-chip--guest">
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

export { CompanionChip };
export default ContactPicker;
