import React, { useState } from "react";
import ItemForm from "../../../components/shared/ItemForm";
import WineSearch from "../../../components/shared/WineSearch";
import WhiskeySearch from "../../../components/shared/WhiskeySearch";
import LabelScanButton from "../../../components/shared/LabelScanButton";
import cellarSchema from "../cellarSchema";

const WINE_COLOR = "#722F37";
const WHISKEY_COLOR = "#B5651D";

function CellarForm({ formData, setFormData, onSubmit, onCancel }) {
  const [scanError, setScanError] = useState(null);
  const isReadOnly = !setFormData;
  const subType = formData.subType || "";

  const handleSubTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, subType: type }));
  };

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
        <>
          {/* ── Sub-type toggle buttons ── */}
          <div style={{ marginBottom: "1rem" }}>
            <div style={{
              fontSize: "var(--font-size-xs)",
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              What are you logging?
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => handleSubTypeSelect("wine")}
                style={{
                  flex: 1,
                  padding: "0.7rem 1rem",
                  borderRadius: "10px",
                  border: subType === "wine" ? `2.5px solid ${WINE_COLOR}` : "2px solid var(--color-border)",
                  background: subType === "wine" ? "linear-gradient(135deg, #FAF0FB 0%, #F5EAF8 100%)" : "var(--color-surface)",
                  color: subType === "wine" ? WINE_COLOR : "var(--color-text-secondary)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: subType === "wine" ? `0 2px 8px rgba(114, 47, 55, 0.15)` : "none",
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>🍷</span> Wine
              </button>
              <button
                type="button"
                onClick={() => handleSubTypeSelect("whiskey")}
                style={{
                  flex: 1,
                  padding: "0.7rem 1rem",
                  borderRadius: "10px",
                  border: subType === "whiskey" ? `2.5px solid ${WHISKEY_COLOR}` : "2px solid var(--color-border)",
                  background: subType === "whiskey" ? "linear-gradient(135deg, #FFF8F0 0%, #FDF3E7 100%)" : "var(--color-surface)",
                  color: subType === "whiskey" ? WHISKEY_COLOR : "var(--color-text-secondary)",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  boxShadow: subType === "whiskey" ? `0 2px 8px rgba(181, 101, 29, 0.15)` : "none",
                }}
              >
                <span style={{ fontSize: "1.3rem" }}>🥃</span> Whiskey
              </button>
            </div>
          </div>

          {/* ── Search + Scan section ── */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-start",
              marginBottom: "1.25rem",
              padding: "0.75rem 1rem",
              background: subType
                ? "linear-gradient(135deg, #FAF0FB 0%, #F5EAF8 100%)"
                : "var(--color-surface)",
              borderRadius: "10px",
              border: subType
                ? "1px solid rgba(139,58,143,0.15)"
                : "1px solid var(--color-border)",
              opacity: subType ? 1 : 0.5,
              pointerEvents: subType ? "auto" : "none",
              transition: "opacity 0.2s, background 0.2s",
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
                {subType ? "Search by name" : "Select wine or whiskey first"}
              </div>
              {subType === "whiskey" ? (
                <WhiskeySearch
                  value={formData.whiskyName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, whiskyName: e.target.value }))
                  }
                  onWhiskeySelect={handleSelect}
                  placeholder="Search whiskeys, distilleries…"
                  disabled={!subType}
                />
              ) : (
                <WineSearch
                  value={formData.wineName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, wineName: e.target.value }))
                  }
                  onWineSelect={handleSelect}
                  placeholder="Search wines, wineries, varietals…"
                  disabled={!subType}
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
        </>
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
