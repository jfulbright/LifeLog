import React, { useState, useRef } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
  formatCurrency,
  handleInputChange,
  isFieldVisible,
} from "../../helpers/operator";
import StateDropdown from "./StateDropdown";
import CountryDropdown from "./CountryDropdown";
import CityAutocomplete from "./CityAutocomplete";
import ContactPicker from "./ContactPicker";
import RecommendSection from "./RecommendSection";
import ShareWithSection from "./ShareWithSection";
import ShareWithCompanionsToggle from "./ShareWithCompanionsToggle";
import LinkedTripPicker from "./LinkedTripPicker";
import PhotoUploadField from "./PhotoUploadField";
import { getCountryContinent } from "../../data/countries";

function ListFieldRenderer({ field, value, onChange, readOnly }) {
  const [inputValue, setInputValue] = useState("");

  if (readOnly) {
    if (!value.length) return null;
    return (
      <ul className="mb-0 ps-3">
        {value.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const handleRemove = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="d-flex gap-2 mb-2">
        <Form.Control
          type="text"
          placeholder={field.placeholder || "Add item"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button variant="outline-secondary" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <ul className="list-group list-group-flush">
          {value.map((item, i) => (
            <li
              key={i}
              className="list-group-item d-flex justify-content-between align-items-center py-1 px-2"
            >
              <span className="small">{item}</span>
              <Button
                variant="link"
                size="sm"
                className="text-danger p-0"
                onClick={() => handleRemove(i)}
                aria-label={`Remove ${item}`}
              >
                &times;
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Normalizes legacy string-array companions into the new companion object format.
 * Existing string entries become { type: "freetext", name: string }.
 * New contact entries stay as { type: "contact", contactId, displayName }.
 */
function normalizeCompanions(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    if (typeof entry === "string") return { type: "freetext", name: entry };
    return entry;
  });
}

function ContactListRenderer({ field, value, onChange, readOnly }) {
  return (
    <ContactPicker
      value={value}
      onChange={onChange}
      placeholder={field.placeholder || "Add from your people or type a name"}
      readOnly={readOnly}
    />
  );
}

function ItemForm({
  schema,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  title = "Entry",
  buttonText = "Save",
}) {
  const isReadOnly = !setFormData;
  const formRef = useRef(null);
  const [validationErrors, setValidationErrors] = useState({});

  const isEditing =
    !!formData?.id ||
    !!formData?.title ||
    !!formData?.make ||
    !!formData?.artist;

  const visibleFields = schema
    .filter((field) => !field.hidden && isFieldVisible(field, formData))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const groupedFields = visibleFields.reduce((acc, field) => {
    const section = field.section || "Main";
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {});

  const validate = () => {
    const errors = {};
    visibleFields.forEach((field) => {
      if (field.required) {
        const val = formData[field.name];
        if (val === undefined || val === null || val === "") {
          errors[field.name] = `${field.label} is required`;
        }
      }
    });
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = visibleFields.find((f) => errors[f.name]);
      if (firstErrorField && formRef.current) {
        const el = formRef.current.querySelector(
          `[name="${firstErrorField.name}"], [id="field-${firstErrorField.name}"]`
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus?.();
        }
      }
      return;
    }

    onSubmit(e);
  };

  const renderField = (field) => {
    // Dynamic label for companions based on status
    const effectiveField = field.name === "companions"
      ? { ...field, label: formData.status === "wishlist" ? "Plan with" : "Who was there?" }
      : field;
    const value = formData[effectiveField.name] ?? "";
    const hasError = !!validationErrors[effectiveField.name];
    const fieldId = `field-${effectiveField.name}`;

    if (isReadOnly && field.isLink && value) {
      return (
        <Form.Group key={field.name} className="mb-3">
          <Form.Label>{field.label}</Form.Label>
          <div>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-decoration-underline"
            >
              {value}
            </a>
          </div>
        </Form.Group>
      );
    }

    const commonProps = {
      name: field.name,
      value,
      onChange: (e) => {
        handleInputChange(e, setFormData);
        if (validationErrors[field.name]) {
          setValidationErrors((prev) => {
            const next = { ...prev };
            delete next[field.name];
            return next;
          });
        }
      },
    };

    let inputElement;
    switch (field.type) {
      case "select":
        if (field.renderAs === "stars") {
          const numValue = parseInt(value, 10) || 0;
          inputElement = (
            <div
              className="d-flex gap-1"
              role="radiogroup"
              aria-label={`${field.label} rating`}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.name]: String(star),
                    }))
                  }
                  className="btn btn-link p-0 text-decoration-none"
                  style={{
                    fontSize: "1.5rem",
                    lineHeight: 1,
                    color: star <= numValue ? "#f5a623" : "#ccc",
                  }}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={star === numValue}
                >
                  {star <= numValue ? "\u2605" : "\u2606"}
                </button>
              ))}
            </div>
          );
        } else if (field.name === "state") {
          inputElement = (
            <StateDropdown
              id={fieldId}
              value={value}
              onChange={(e) => {
                handleInputChange(e, setFormData);
                if (validationErrors[field.name]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.name];
                    return next;
                  });
                }
              }}
            />
          );
        } else if (field.name === "country") {
          inputElement = (
            <CountryDropdown
              id={fieldId}
              value={value}
              onChange={(e) => {
                handleInputChange(e, setFormData);
                if (validationErrors[field.name]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[field.name];
                    return next;
                  });
                }
              }}
              onFullChange={(selected) => {
                if (selected) {
                  setFormData((prev) => ({
                    ...prev,
                    continent: selected.continent || getCountryContinent(selected.code),
                    state: "", // clear stale state/region when country changes
                  }));
                }
              }}
            />
          );
        } else {
          inputElement = (
            <Form.Select
              {...commonProps}
              id={fieldId}
              isInvalid={hasError}
            >
              <option value="">Select</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>
                  {field.optionLabels?.[opt] || opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
            </Form.Select>
          );
        }
        break;

      case "textarea":
        inputElement = (
          <div>
            <Form.Control
              as="textarea"
              rows={field.isSnapshot ? 3 : 2}
              {...commonProps}
              id={fieldId}
              placeholder={field.placeholder || ""}
              maxLength={field.maxLength || undefined}
              isInvalid={hasError}
            />
            {field.maxLength && (
              <div
                className="text-muted text-end"
                style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}
              >
                {(value || "").length}/{field.maxLength}
              </div>
            )}
          </div>
        );
        break;

      case "list":
        inputElement = (
          <ListFieldRenderer
            field={field}
            value={Array.isArray(value) ? value : []}
            onChange={(newList) =>
              setFormData((prev) => ({ ...prev, [field.name]: newList }))
            }
            readOnly={isReadOnly}
          />
        );
        break;

      case "contact-list":
        inputElement = (
          <ContactListRenderer
            field={field}
            value={normalizeCompanions(value)}
            onChange={(newList) =>
              setFormData((prev) => ({ ...prev, [field.name]: newList }))
            }
            readOnly={isReadOnly}
          />
        );
        break;

      case "toggle":
        inputElement = (
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id={fieldId}
              checked={!!value}
              disabled={isReadOnly}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [field.name]: e.target.checked,
                }))
              }
            />
          </div>
        );
        break;

      case "city-autocomplete":
        inputElement = (
          <CityAutocomplete
            id={fieldId}
            value={value}
            countryCode={formData.country || ""}
            onChange={(e) => handleInputChange(e, setFormData)}
            onLocationSelect={(location) => {
              setFormData((prev) => {
                const updates = { ...prev, city: location.city };
                if (location.lat) updates.lat = location.lat;
                if (location.lng) updates.lng = location.lng;
                // Always apply country + state from Mapbox result
                if (location.country) updates.country = location.country;
                if (location.state) updates.state = location.state;
                if (location.country) {
                  updates.continent = getCountryContinent(location.country);
                }
                return updates;
              });
            }}
            placeholder={field.placeholder}
            disabled={isReadOnly}
          />
        );
        break;

      case "state-or-region": {
        const currentCountry = formData.country || "US";
        const isNorthAmerica = currentCountry === "US" || currentCountry === "CA";
        if (isNorthAmerica) {
          inputElement = (
            <StateDropdown
              id={fieldId}
              value={value}
              onChange={(e) => handleInputChange(e, setFormData)}
              name={field.name}
            />
          );
        } else {
          inputElement = (
            <Form.Control
              type="text"
              id={fieldId}
              name={field.name}
              value={value}
              onChange={(e) => handleInputChange(e, setFormData)}
              placeholder="State / Province / Region"
              disabled={isReadOnly}
            />
          );
        }
        break;
      }

      case "linked-trip":
        inputElement = (
          <LinkedTripPicker
            linkedTripId={formData.linkedTripId || ""}
            linkedTripTitle={formData.linkedTripTitle || ""}
            formDate={formData.startDate || ""}
            formCity={formData.city || ""}
            formCountry={formData.country || ""}
            onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
            readOnly={isReadOnly}
          />
        );
        break;

      case "recommend":
        inputElement = (
          <RecommendSection formData={formData} setFormData={setFormData} />
        );
        break;

      case "visible-to":
        inputElement = (
          <ShareWithSection formData={formData} setFormData={setFormData} />
        );
        break;

      case "photo":
        inputElement = (
          <PhotoUploadField
            field={field}
            value={value}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, [field.name]: url }))
            }
            itemId={formData.id}
          />
        );
        break;

      default:
        inputElement = (
          <Form.Control
            type={field.isCurrency ? "text" : field.type || "text"}
            {...commonProps}
            id={fieldId}
            value={field.isCurrency ? formatCurrency(value) : value}
            placeholder={field.placeholder || ""}
            maxLength={field.maxLength || undefined}
            inputMode={field.inputMode || undefined}
            isInvalid={hasError}
          />
        );
        break;
    }

    return (
      <Form.Group
        key={field.name}
        className={`mb-3${field.isSnapshot ? " snapshot-field-group" : ""}`}
      >
        {field.type !== "recommend" && field.type !== "visible-to" && field.type !== "linked-trip" && field.type !== "photo" && (
          <Form.Label htmlFor={fieldId}>
            {effectiveField.label}
            {field.required && (
              <span className="text-danger ms-1">*</span>
            )}
          </Form.Label>
        )}
        {inputElement}
        {hasError && (
          <Form.Control.Feedback type="invalid" style={{ display: "block" }}>
            {validationErrors[field.name]}
          </Form.Control.Feedback>
        )}
      </Form.Group>
    );
  };

  return (
    <Form ref={formRef} onSubmit={handleSubmit} noValidate>
      {Object.entries(groupedFields).map(([section, fields], sIdx) => {
        const isSnapSection = section === "Snapshots";
        const isSocialSection = section === "Social";
        const isTripSection = section === "Trip";
        const isPhotoSection = section === "Photos";

        return (
          <div key={section} className={isSnapSection ? "snap-section-wrapper" : isPhotoSection ? "photo-section-wrapper" : ""}>
            {isSnapSection ? (
              <div className="snap-section-banner">
                <span className="snap-section-icon" aria-hidden="true">&#128247;</span>
                <div>
                  <div className="snap-section-title">Capture your snapshots</div>
                  <div className="snap-section-subtitle">
                    Three quick memories -- 140 characters each
                  </div>
                </div>
              </div>
            ) : isPhotoSection ? (
              <div className="photo-section-banner">
                <span className="photo-section-icon" aria-hidden="true">&#128247;</span>
                <div>
                  <div className="photo-section-title">Add up to 3 photos</div>
                  <div className="photo-section-subtitle">
                    Upload from your camera roll or take a new photo
                  </div>
                </div>
              </div>
            ) : isSocialSection ? (
              <div className="snap-section-banner" style={{ background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)", borderColor: "var(--color-border)" }}>
                <span className="snap-section-icon" aria-hidden="true">&#129309;</span>
                <div>
                  <div className="snap-section-title">Social</div>
                  <div className="snap-section-subtitle">
                    Share experiences, control visibility, and recommend to others
                  </div>
                </div>
              </div>
            ) : isTripSection ? (
              <h6 className="form-section-heading">
                Part of a Trip
                <span style={{ display: "block", fontSize: "var(--font-size-xs)", fontWeight: 400, color: "var(--color-text-tertiary)", marginTop: "0.25rem" }}>
                  Link this to a trip in your Travel log
                </span>
              </h6>
            ) : (
              <h6
                className="form-section-heading"
                style={
                  sIdx === 0
                    ? { paddingTop: 0, borderTop: "none" }
                    : undefined
                }
              >
                {section}
              </h6>
            )}
            <Row>
              {fields.map((field) => (
                <React.Fragment key={field.name}>
                  {isSocialSection && field.name === "companions" && (
                    <Col md={12}>
                      <div className="share-with-sublabel" style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>
                        🤝 Shared Experiences
                      </div>
                    </Col>
                  )}
                  {isSocialSection && field.type === "recommend" && (
                    <Col md={12}>
                      <div className="share-with-sublabel" style={{ marginTop: "0.75rem", marginBottom: "0.5rem" }}>
                        ⭐ Recommendations
                      </div>
                    </Col>
                  )}
                  <Col md={field.fullWidth ? 12 : (field.col || 6)}>
                    {renderField(field)}
                  </Col>
                  {field.name === "companions" && !isReadOnly && (
                    <Col md={12}>
                      <ShareWithCompanionsToggle
                        companions={normalizeCompanions(formData.companions || [])}
                        value={formData.shareWithCompanionIds || []}
                        onChange={(ids) =>
                          setFormData((prev) => ({
                            ...prev,
                            shareWithCompanionIds: ids,
                          }))
                        }
                      />
                    </Col>
                  )}
                </React.Fragment>
              ))}
            </Row>
          </div>
        );
      })}

      {!isReadOnly && (
        <div className="d-flex gap-2 mt-3">
          <Button variant="primary" type="submit" className="flex-grow-1">
            {isEditing ? `Update ${buttonText}` : `Save ${buttonText}`}
          </Button>
          {onCancel && (
            <Button variant="outline-secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </Form>
  );
}

export default ItemForm;
