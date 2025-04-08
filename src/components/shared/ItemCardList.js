import React from "react";
import { Card, ListGroup, Button } from "react-bootstrap";
import { isFieldVisible } from "../../utils/operator";

/**
 * Renders a clean list of item entries using schema field labels.
 */
function ItemCardList({
  title,
  items,
  schema,
  onEdit,
  onDelete,
  renderItemExtras,
}) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <ListGroup variant="flush">
          {items.map((item, index) => (
            <ListGroup.Item key={index}>
              <div className="mb-1 fw-bold">
                {item?.type || item?.title || item?.make || `Item ${index + 1}`}
              </div>

              {/* Render all visible schema fields */}
              {/* Only display the field if it's not marked as hidden AND it passes the visibleWhen condition (defined in utils/operator.js) */}

              {schema.map((field) => {
                if (field.hidden || !isFieldVisible(field, item)) return null;
                const value = item[field.name];
                if (!value) return null;

                return (
                  <div key={field.name}>
                    <strong>{field.label}:</strong> {value}
                  </div>
                );
              })}
              {renderItemExtras && renderItemExtras(item)}

              {(onEdit || onDelete) && (
                <div className="mt-2">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => onEdit(index)}
                    >
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      className="ms-2"
                      onClick={() => onDelete(index)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
}

export default ItemCardList;
