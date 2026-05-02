import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import {
  formatCurrency,
  handleInputChange,
  isFieldVisible,
} from "helpers/operator";
import StateDropdown from "./StateDropdown";
import CountryDropdown from "./CountryDropdown";

/**
 * Renders an editable array field (e.g. setlist songs).
 * Supports add/remove and displays as a read-only list when not editable.
 */
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
 * A shared, reusable form component that dynamically renders fields
 * based on a schema definition.
 * Supports: conditional visibility, sections, custom ordering, read-only mode.
 */
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

  // Detect if we're editing based on key identifying fields
  const isEditing =
    !!formData?.id ||
    !!formData?.title ||
    !!formData?.make ||
    !!formData?.artist;

  // 1. Filter and sort visible fields
  const visibleFields = schema
    .filter((field) => !field.hidden && isFieldVisible(field, formData))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // 2. Group fields by `section` for display layout
  const groupedFields = visibleFields.reduce((acc, field) => {
    const section = field.section || "Main";
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {});

  // 3. Renders a single form field based on type
  const renderField = (field) => {
    const value = formData[field.name] ?? "";

    // Render read-only links (e.g. Setlist.fm, Photo Link)
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

    // Common props for input fields
    const commonProps = {
      name: field.name,
      value,
      onChange: (e) => handleInputChange(e, setFormData),
    };

    // Input element rendering based on type
    let inputElement;
    switch (field.type) {
      case "select":
        if (field.renderAs === "stars") {
          const numValue = parseInt(value, 10) || 0;
          inputElement = (
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, [field.name]: String(star) }))
                  }
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: "1.5rem", lineHeight: 1, color: star <= numValue ? "#f5a623" : "#ccc" }}
                >
                  {star <= numValue ? "\u2605" : "\u2606"}
                </button>
              ))}
            </div>
          );
        } else if (field.name === "state") {
          inputElement = (
            <StateDropdown
              value={value}
              onChange={(e) => handleInputChange(e, setFormData)}
            />
          );
        } else if (field.name === "country") {
          inputElement = (
            <CountryDropdown
              value={value}
              onChange={(e) => handleInputChange(e, setFormData)}
            />
          );
        } else {
          inputElement = (
            <Form.Select {...commonProps}>
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
              placeholder={field.placeholder || ""}
              maxLength={field.maxLength || undefined}
            />
            {field.maxLength && (
              <div className="text-muted text-end" style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
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
            value={field.isCurrency ? formatCurrency(value) : value}
          />
        );
        break;
    }

    // Wrap field with label and optional hint
    return (
      <Form.Group key={field.name} className="mb-3">
        <Form.Label>
          {field.label}
          {field.optional && (
            <span className="text-muted ms-1">(optional)</span>
          )}
        </Form.Label>
        {inputElement}
      </Form.Group>
    );
  };

  // 4. Render form layout with sections, columns, and submit button
  return (
    <Form onSubmit={onSubmit}>
      {Object.entries(groupedFields).map(([section, fields], sIdx) => (
        <div key={section}>
          <h6
            className="form-section-heading"
            style={sIdx === 0 ? { paddingTop: 0, borderTop: "none" } : undefined}
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
