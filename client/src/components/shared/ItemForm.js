import React from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import {
  formatCurrency,
  handleInputChange,
  isFieldVisible,
} from "helpers/operator";

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
        break;

      case "textarea":
        inputElement = <Form.Control as="textarea" rows={2} {...commonProps} />;
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
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>{isEditing ? `Edit ${title}` : `Add ${title}`}</Card.Title>
        <Form onSubmit={onSubmit}>
          {Object.entries(groupedFields).map(([section, fields]) => (
            <fieldset key={section} className="mb-4">
              <legend className="fw-bold">{section}</legend>
              <Row>
                {fields.map((field) => (
                  <Col md={field.fullWidth ? 12 : 6} key={field.name}>
                    {renderField(field)}
                  </Col>
                ))}
              </Row>
            </fieldset>
          ))}

          {/* Submit button appears only if the form is editable */}
          {!isReadOnly && (
            <Button variant="primary" type="submit">
              {isEditing ? `Update ${buttonText}` : `Add ${buttonText}`}
            </Button>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default ItemForm;
