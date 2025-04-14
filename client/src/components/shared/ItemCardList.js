import React from "react";
import { Card, ListGroup, Button } from "react-bootstrap";
import { isFieldVisible } from "../../helpers/operator";

/**
 * Renders a clean list of item entries using schema field labels, and a form for adding new items.
 */
function ItemCardList({
  title,
  items = [],
  schema = [],
  onEdit,
  onDelete,
  renderItemExtras,
  FormComponent,
  formData,
  setFormData,
  onSubmit,
}) {
  if (!Array.isArray(items)) {
    console.warn("ItemCardList received non-array items:", items);
    return null;
  }

  return (
    <>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>{title}</Card.Title>
          <ListGroup variant="flush">
            {items.map((item, index) => (
              <ListGroup.Item key={index}>
                <div className="mb-1 fw-bold">
                  {item?.type ||
                    item?.title ||
                    item?.make ||
                    `Item ${index + 1}`}
                </div>

                {schema.map((field) => {
                  if (field.hidden || !isFieldVisible(field, item)) return null;

                  const value = item[field.name];
                  if (!value || (Array.isArray(value) && value.length === 0))
                    return null;

                  return (
                    <div key={field.name}>
                      <strong>{field.label}:</strong>{" "}
                      {Array.isArray(value) ? (
                        <ul className="mb-1 ps-4">
                          {value.map((v, i) => (
                            <li key={i}>{v}</li>
                          ))}
                        </ul>
                      ) : (
                        value
                      )}
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

      {/* Render the form below the card */}
      {FormComponent && (
        <FormComponent
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
        />
      )}
    </>
  );
}

export default ItemCardList;
