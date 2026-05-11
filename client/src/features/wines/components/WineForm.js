import React, { useState } from "react";
import ItemForm from "../../../components/shared/ItemForm";
import WineSearch from "../../../components/shared/WineSearch";
import LabelScanButton from "../../../components/shared/LabelScanButton";
import wineSchema from "../wineSchema";

function WineForm({ formData, setFormData, onSubmit, onCancel }) {
  const [scanError, setScanError] = useState(null);
  const isReadOnly = !setFormData;

  const handleWineSelect = (fields) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleScanResult = (fields) => {
    // Only clear the error banner when we actually got wine metadata — not
    // when the result is photo-only (which happens when OCR/Vision fails).
    const hasWineData = fields.wineName || fields.winery || fields.wineType;
    if (hasWineData) setScanError(null);

    setFormData((prev) => {
      const merged = { ...prev };
      Object.entries(fields).forEach(([key, val]) => {
        // Only overwrite if the field is currently empty
        if (val && !prev[key]) merged[key] = val;
      });
      // photoLink and barcodeUpc always overwrite
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
          {/* Wine name search */}
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
            <WineSearch
              value={formData.wineName || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, wineName: e.target.value }))
              }
              onWineSelect={handleWineSelect}
              placeholder="Search wines, wineries, varietals…"
            />
          </div>

          {/* Label scan button */}
          <div style={{ flexShrink: 0, paddingTop: "1.55rem" }}>
            <LabelScanButton
              onResult={handleScanResult}
              onError={(msg) => setScanError(msg)}
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
        schema={wineSchema}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        title="Add a Wine"
        buttonText="Wine"
      />
    </div>
  );
}

export default WineForm;
