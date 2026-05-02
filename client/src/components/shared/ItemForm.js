import React, { useState, useRef } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
  formatCurrency,
  handleInputChange,
  isFieldVisible,
} from "helpers/operator";
import StateDropdown from "./StateDropdown";
import CountryDropdown from "./CountryDropdown";

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
    const value = formData[field.name] ?? "";
    const hasError = !!validationErrors[field.name];
    const fieldId = `field-${field.name}`;

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
                  {opt}
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
              rows={2}
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
      <Form.Group key={field.name} className="mb-3">
        <Form.Label htmlFor={fieldId}>
          {field.label}
          {field.optional && (
            <span className="text-muted ms-1">(optional)</span>
          )}
          {field.required && (
            <span className="text-danger ms-1">*</span>
          )}
        </Form.Label>
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
      {Object.entries(groupedFields).map(([section, fields], sIdx) => (
        <div key={section}>
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
          <Row>
            {fields.map((field) => (
              <Col md={field.fullWidth ? 12 : 6} key={field.name}>
                {renderField(field)}
              </Col>
            ))}
          </Row>
        </div>
      ))}

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
