import React, { useState } from "react";
import ItemForm from "../../../components/shared/ItemForm";
import WineSearch from "../../../components/shared/WineSearch";
import WhiskeySearch from "../../../components/shared/WhiskeySearch";
import LabelScanButton from "../../../components/shared/LabelScanButton";
import cellarSchema from "../cellarSchema";

const CELLAR_COLOR = "var(--color-cellar, #8B3A8F)";

function CellarForm({ formData, setFormData, onSubmit, onCancel }) {
  const [scanError, setScanError] = useState(null);
  const isReadOnly = !setFormData;
  const subType = formData.subType || "wine";

  const handleSelect = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleScanResult = (fields) => {
    const hasData = fields.wineName || fields.whiskyName || fields.winery || fields.distillery || fields.wineType || fields.whiskyType;
    if (hasData) setScanError(null);

    setFormData((prev) => {
      const merged = { ...prev };
      Object.entries(fields).forEach(([key, val]) => {
        if (val && !prev[key]) merged[key] = val;
      });
      if (fields.photoLink) merged.photoLink = fields.photoLink;
      if (fields.barcodeUpc) merged.barcodeUpc = fields.barcodeUpc;
      return merged;
    });
  };

  return (
    <div>
      {!isReadOnly && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
            marginBottom: "1.25rem",
            padding: "0.75rem 1rem",
            background: "linear-gradient(135deg, #FAF0FB 0%, #F5EAF8 100%)",
            borderRadius: "10px",
            border: "1px solid rgba(139,58,143,0.15)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "0.35rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>
              Search by name
            </div>
            {subType === "whiskey" ? (
              <WhiskeySearch
                value={formData.whiskyName || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, whiskyName: e.target.value }))
                }
                onWhiskeySelect={handleSelect}
                placeholder="Search whiskeys, distilleries…"
              />
            ) : (
              <WineSearch
                value={formData.wineName || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, wineName: e.target.value }))
                }
                onWineSelect={handleSelect}
                placeholder="Search wines, wineries, varietals…"
              />
            )}
          </div>

          <div style={{ flexShrink: 0, paddingTop: "1.55rem" }}>
            <LabelScanButton
              onResult={handleScanResult}
              onError={(msg) => setScanError(msg)}
              itemId={formData.id}
              subType={subType}
            />
          </div>
        </div>
      )}

      {scanError && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.5rem 0.75rem",
          background: "var(--color-warning-bg, #FFF3CD)",
          borderRadius: "6px",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-warning-text, #856404)",
        }}>
          {scanError}
        </div>
      )}

      <ItemForm
        schema={cellarSchema}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        title={subType === "whiskey" ? "Add a Whiskey" : "Add a Wine"}
        buttonText={subType === "whiskey" ? "Whiskey" : "Wine"}
      />
    </div>
  );
}

export default CellarForm;
