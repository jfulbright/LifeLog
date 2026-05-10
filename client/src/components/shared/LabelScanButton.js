import React, { useRef, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  lookupByBarcode,
  scanLabelOcr,
  parseOcrText,
  searchWines,
  fetchWineDetail,
} from "../../features/wines/api/wineApi";

const WINE_COLOR = "var(--color-wines, #8B3A8F)";

/**
 * Three-path label scan button for WineForm.
 *
 *   Path 1 — Barcode  : @zxing/browser reads UPC → Open Food Facts lookup
 *   Path 2 — OCR      : Google Cloud Vision (via server proxy) → VinoFYI fuzzy match
 *   Path 3 — Photo    : captured image always stored as photoLink
 *
 * Props:
 *   onResult(fields)  — called with a partial formData object to merge
 *   onError(message)  — called with a user-readable error string
 */
function LabelScanButton({ onResult, onError }) {
  const fileInputRef = useRef(null);
  const [phase, setPhase] = useState(null); // null | "barcode" | "ocr" | "search"

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // strip data: prefix
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const fileToObjectUrl = (file) => URL.createObjectURL(file);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be re-selected
    e.target.value = "";

    const objectUrl = fileToObjectUrl(file);
    const fields = { photoLink: objectUrl };

    try {
      // ── Path 1: Barcode ────────────────────────────────────────────────────
      setPhase("barcode");
      let barcodeResult = null;
      try {
        const reader = new BrowserMultiFormatReader();
        const img = new Image();
        img.src = objectUrl;
        await new Promise((res) => { img.onload = res; img.onerror = res; });
        const decoded = await reader.decodeFromImageElement(img);
        if (decoded?.getText()) {
          barcodeResult = decoded.getText();
        }
      } catch {
        // No barcode found — continue to OCR
      }

      if (barcodeResult) {
        const barcodeFields = await lookupByBarcode(barcodeResult);
        if (barcodeFields) {
          onResult({ ...fields, ...barcodeFields });
          setPhase(null);
          return;
        }
        // Barcode found but not in Open Food Facts — use UPC as seed for OCR search
        fields.barcodeUpc = barcodeResult;
      }

      // ── Path 2: OCR via Google Cloud Vision ────────────────────────────────
      setPhase("ocr");
      let ocrText = null;
      try {
        const base64 = await fileToBase64(file);
        ocrText = await scanLabelOcr(base64);
      } catch {
        // OCR failed — show what we have
      }

      if (ocrText) {
        const { vintageGuess, searchQuery } = parseOcrText(ocrText);
        if (vintageGuess) fields.vintage = vintageGuess;

        if (searchQuery) {
          setPhase("search");
          const results = await searchWines(searchQuery);
          const wineResult = results.find((r) => r.type === "wine");
          if (wineResult) {
            const detail = await fetchWineDetail(wineResult.slug);
            if (detail) {
              onResult({ ...fields, ...detail, vintage: fields.vintage || detail.vintage || "" });
              setPhase(null);
              return;
            }
          }
          // No confident match — pre-populate wine name with best OCR text
          const nameCandidate = searchQuery.split(" ").slice(0, 5).join(" ");
          fields.wineName = nameCandidate;
        }
      }

      // ── Path 3: Return whatever we have (photo + any partial data) ─────────
      onResult(fields);
    } catch (err) {
      console.error("Label scan error:", err);
      onError?.("Scan failed — you can still enter the wine name manually.");
      // Still deliver the photo even on error
      onResult({ photoLink: objectUrl });
    } finally {
      setPhase(null);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const phaseLabel = {
    barcode: "Reading barcode…",
    ocr: "Reading label…",
    search: "Matching wine…",
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        onClick={handleClick}
        disabled={!!phase}
        style={{
          background: phase ? "var(--color-surface)" : WINE_COLOR,
          border: `2px solid ${WINE_COLOR}`,
          color: phase ? WINE_COLOR : "#fff",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "var(--font-size-sm)",
          padding: "0.45rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {phase ? (
          <>
            <Spinner animation="border" size="sm" style={{ color: WINE_COLOR }} />
            {phaseLabel[phase]}
          </>
        ) : (
          <>
            📷 Scan Label
          </>
        )}
      </Button>
    </>
  );
}

export default LabelScanButton;
