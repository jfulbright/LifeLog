import React from "react";
import { Form, Button, Card, Row, Col } from "react-bootstrap";
import {
  formatCurrency,
  handleInputChange,
  isFieldVisible,
} from "../../utils/operator";

/**
 * A shared, reusable form component that dynamically renders fields
 * based on a schema definition.
 */
function ItemForm({
  schema,
  formData,
  setFormData,
  onSubmit,
  title = "Add Entry",
  buttonText = "Add",
}) {
  const isReadOnly = !setFormData;

  // Render a single field from the schema
  const renderField = (field) => {
    if (!isFieldVisible(field, formData)) return null;
    const value = formData[field.name] || "";

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
      value: formData[field.name] || "",
      onChange: (e) => handleInputChange(e, setFormData),
    };

    if (field.type === "select") {
      return (
        <Form.Group key={field.name} className="mb-3">
          <Form.Label>{field.label}</Form.Label>
          <Form.Select {...commonProps}>
            <option value="">Select</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      );
    }

    if (field.type === "textarea") {
      return (
        <Form.Group key={field.name} className="mb-3">
          <Form.Label>{field.label}</Form.Label>
          <Form.Control as="textarea" rows={2} {...commonProps} />
        </Form.Group>
      );
    }

    return (
      <Form.Group key={field.name} className="mb-3">
        <Form.Label>{field.label}</Form.Label>
        <Form.Control
          type={field.isCurrency ? "text" : field.type}
          {...commonProps}
          value={
            field.isCurrency
              ? formatCurrency(formData[field.name] || "")
              : formData[field.name] || ""
          }
        />
      </Form.Group>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Form onSubmit={onSubmit}>
          <Row>
            {schema.map((field, index) => (
              <Col md={field.fullWidth ? 12 : 6} key={index}>
                {renderField(field)}
              </Col>
            ))}
          </Row>
          {!isReadOnly && (
            <Button variant="primary" type="submit">
              {buttonText}
            </Button>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
}

export default ItemForm;
