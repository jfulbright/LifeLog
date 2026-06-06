import React from "react";
import { getCategoryMeta } from "../../helpers/categoryMeta";
import { useAppData } from "../../contexts/AppDataContext";
import EntryHeader from "./EntryHeader";
import ItemDetailContent from "./ItemDetailContent";

function ItemCardList({
  category = "",
  title,
  items = [],
  schema = [],
  onEdit,
  onDelete,
  onViewDetail,
  renderItemExtras,
  renderCompactExtra,
}) {
  const meta = getCategoryMeta(category);
  const { contacts } = useAppData();

  if (!Array.isArray(items)) {
    console.warn("ItemCardList received non-array items:", items);
    return null;
  }

  const headerFieldNames = new Set([
    meta.primaryField,
    ...meta.secondaryFields,
    meta.dateField,
    "status",
    "endDate",
    ...(meta.extraHandledFields || []),
  ]);

  return (
    <div>
      {title && (
        <h5 className="mb-3" style={{ fontWeight: 600 }}>
          {title}
        </h5>
      )}
      <div className="d-flex flex-column" style={{ gap: "var(--spacing-card-gap)" }}>
        {items.map((item, index) => {
          const itemId = item.id ?? index;

          return (
            <div key={itemId} className="card" data-category={category}>
              <div className="item-card">
                <EntryHeader
                  item={item}
                  category={category}
                  schema={schema}
                  contacts={contacts}
                  onClick={onViewDetail ? () => onViewDetail(item) : undefined}
                />

                {renderCompactExtra && renderCompactExtra(item)}

                <ItemDetailContent
                  item={item}
                  category={category}
                  schema={schema}
                  contacts={contacts}
                  headerFieldNames={headerFieldNames}
                  onEdit={onEdit ? () => onEdit(itemId) : undefined}
                  onDelete={onDelete ? () => onDelete(itemId) : undefined}
                  onViewDetail={onViewDetail ? () => onViewDetail(item) : undefined}
                  renderItemExtras={renderItemExtras}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ItemCardList;
