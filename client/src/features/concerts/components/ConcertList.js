import React, { useState } from "react";
import concertSchema from "features/concerts/concertSchema";
import ConcertForm from "./ConcertForm";
import ItemCardList from "components/shared/ItemCardList";

function ConcertList({ items, setItems }) {
  const [formData, setFormData] = useState({});

  const handleAddConcert = (newConcert) => {
    setItems([...items, newConcert]);
    setFormData({}); // clear after submit
  };

  return (
    <ItemCardList
      title="Concerts"
      schema={concertSchema.fields}
      items={items}
      FormComponent={ConcertForm}
      formData={formData}
      setFormData={setFormData}
      onSubmit={handleAddConcert}
    />
  );
}

export default ConcertList;
