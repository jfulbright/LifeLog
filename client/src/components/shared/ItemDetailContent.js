import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import { useAppData } from "../../contexts/AppDataContext";
import EntryHeader from "./EntryHeader";
import EntryView from "./EntryView";

function ItemDetailContent({
  item,
  category,
  schema,
  contacts,
  headerFieldNames,
  onEdit,
  onDelete,
  renderItemExtras,
}) {
  const [showModal, setShowModal] = useState(false);
  const { contacts: appContacts } = useAppData();
  const resolvedContacts = contacts || appContacts;

  return (
    <>
      <EntryView
        item={item}
        category={category}
        schema={schema}
        contacts={resolvedContacts}
        headerFieldNames={headerFieldNames}
        renderItemExtras={renderItemExtras}
        expanded={false}
        onShowDetails={() => setShowModal(true)}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Body style={{ maxHeight: "85vh", overflowY: "auto", padding: "1.25rem" }}>
          <EntryHeader
            item={item}
            category={category}
            schema={schema}
            contacts={resolvedContacts}
          />

          <div style={{ marginTop: "1rem" }}>
            <EntryView
              item={item}
              category={category}
              schema={schema}
              contacts={resolvedContacts}
              headerFieldNames={headerFieldNames}
              onEdit={() => { setShowModal(false); if (onEdit) onEdit(); }}
              onDelete={() => { setShowModal(false); if (onDelete) onDelete(); }}
              renderItemExtras={renderItemExtras}
              expanded={true}
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default ItemDetailContent;
