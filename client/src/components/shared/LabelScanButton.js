import React, { useRef, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  lookupByBarcode,
  scanLabelOcr,
  parseOcrText,
  searchWines,
  fetchWineDetail,
  searchWhiskeys,
  fetchWhiskeyDetail,
} from "../../features/cellar/api/cellarApi";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

const WINE_COLOR = "var(--color-cellar, #8B3A8F)";

/**
 * Three-path label scan button for WineForm.
 *
 *   Path 1 — Barcode  : @zxing/browser reads UPC → Open Food Facts lookup
 *   Path 2 — OCR      : Google Cloud Vision (via server proxy) → VinoFYI fuzzy match
 *   Path 3 — Photo    : captured image uploaded to Supabase Storage; signed URL
 *                        stored in photoLink field
 *
 * Props:
 *   onResult(fields)  — called with a partial formData object to merge
 *   onError(message)  — called with a user-readable string when scan partially fails
 *   itemId            — item ID for building the Supabase Storage path
 *   subType           — "wine" or "whiskey" — determines which search API to use
 */
function LabelScanButton({ onResult, onError, itemId, subType }) {
  const fileInputRef = useRef(null);
  const [phase, setPhase] = useState(null); // null | "barcode" | "ocr" | "search"
  const { uploadPhoto } = usePhotoUpload();

  const handleClick = () => fileInputRef.current?.click();

  /** Returns the full data URL string (used for photoLink so it persists). */
  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /** Strips the `data:…;base64,` prefix for the Google Vision API body. */
  const dataUrlToBase64 = (dataUrl) => dataUrl.split(",")[1];

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // allow re-selecting the same file next time

    let dataUrl = null;
    // Build up fields incrementally — always at least deliver the photo
    const fields = {};

    try {
      // Read the file once as a data URL (used for OCR processing only)
      dataUrl = await fileToDataUrl(file);
      console.log("[LabelScan] Image loaded — size:", Math.round(dataUrl.length / 1024), "KB");

      // Upload to Supabase Storage — store signed URL instead of base64
      const signedUrl = await uploadPhoto(file, itemId, "label");
      if (signedUrl) {
        fields.photoLink = signedUrl;
        console.log("[LabelScan] Photo uploaded to Supabase Storage");
      } else {
        fields.photoLink = dataUrl;
        console.warn("[LabelScan] Storage upload failed — falling back to data URL");
      }

      // ── Path 1: Barcode ──────────────────────────────────────────────────────
      setPhase("barcode");
      let barcodeResult = null;
      try {
        // Create a short-lived object URL just for ZXing (revoked immediately after)
        const objectUrl = URL.createObjectURL(file);
        const reader = new BrowserMultiFormatReader();
        // ZXing logs a NotFoundException (expected) when no barcode is found.
        // Suppress both warn and error channels so the console stays clean.
        const origError = console.error;
        const origWarn = console.warn;
        console.error = () => {};
        console.warn = () => {};
        try {
          const decoded = await reader.decodeFromImageUrl(objectUrl);
          if (decoded?.getText()) barcodeResult = decoded.getText();
        } finally {
          console.error = origError;
          console.warn = origWarn;
          URL.revokeObjectURL(objectUrl); // safe to revoke — ZXing is done with it
        }
      } catch {
        // NotFoundException — no barcode, continue to OCR
      }
      console.log("[LabelScan] Barcode result:", barcodeResult || "none");

      if (barcodeResult) {
        fields.barcodeUpc = barcodeResult;
        const barcodeFields = await lookupByBarcode(barcodeResult);
        console.log("[LabelScan] Open Food Facts lookup:", barcodeFields || "no match");
        if (barcodeFields) {
          // Barcode hit — deliver everything and done
          onResult({ ...fields, ...barcodeFields });
          setPhase(null);
          return;
        }
        // Barcode found but not in Open Food Facts — fall through to OCR with UPC noted
      }

      // ── Path 2: OCR via Google Cloud Vision ─────────────────────────────────
      setPhase("ocr");
      console.log("[LabelScan] Sending image to OCR server...");
      let ocrText = null;
      try {
        ocrText = await scanLabelOcr(dataUrlToBase64(dataUrl));
      } catch (err) {
        console.error("[LabelScan] OCR threw unexpectedly:", err);
        // fall through gracefully
      }
      console.log("[LabelScan] OCR result:", ocrText ? `"${ocrText.slice(0, 120)}…"` : "null / empty");

      if (ocrText) {
        const { vintageGuess, searchQuery, varietal, wineType, wineName: ocrName, region } = parseOcrText(ocrText);
        console.log("[LabelScan] Parsed OCR →", { vintageGuess, searchQuery, varietal, wineType, ocrName, region });

        const isWhiskey = subType === "whiskey";

        if (!isWhiskey) {
          if (vintageGuess) fields.vintage  = vintageGuess;
          if (varietal)     fields.varietal  = varietal;
          if (wineType)     fields.wineType  = wineType;
        }
        if (region) fields.region = region;

        if (searchQuery) {
          setPhase("search");
          let results = [];
          try {
            results = isWhiskey
              ? await searchWhiskeys(searchQuery)
              : await searchWines(searchQuery);
          } catch {
            // search unavailable — fall through to name pre-fill
          }
          console.log(`[LabelScan] ${isWhiskey ? "WhiskeyFYI" : "VinoFYI"} search returned`, results.length, "results:", results);

          const matchType = isWhiskey ? "expression" : "wine";
          const matchResult = results.find((r) => r.type === matchType);
          if (matchResult) {
            const detail = isWhiskey
              ? await fetchWhiskeyDetail(matchResult.slug)
              : await fetchWineDetail(matchResult.slug);
            console.log("[LabelScan] Detail:", detail);
            if (detail) {
              const merged = {
                ...fields,
                ...detail,
                ...(isWhiskey ? {} : { vintage: fields.vintage || detail.vintage || "" }),
              };
              console.log("[LabelScan] Full match — delivering:", Object.keys(merged));
              onResult(merged);
              setPhase(null);
              return;
            }
          }

          // OCR worked but no confident match — pre-fill name from label text
          const nameCandidate = ocrName || searchQuery.split(" ").slice(0, 4).join(" ");
          if (isWhiskey) {
            fields.whiskyName = nameCandidate;
          } else {
            fields.wineName = nameCandidate;
          }
          console.log("[LabelScan] No match — pre-filling name:", nameCandidate);
          onError?.(
            `Label read — no exact match found. Name pre-filled from label text. Please review and adjust.`
          );
        } else {
          // No search query but we may still have a clean name from OCR
          if (ocrName) {
            if (isWhiskey) {
              fields.whiskyName = ocrName;
            } else {
              fields.wineName = ocrName;
            }
          }
          console.log("[LabelScan] OCR text found but no usable search query extracted.");
          onError?.("Label photo saved. Couldn't extract text — enter the name manually.");
        }
      } else {
        // OCR returned nothing (server not configured, API error, or unreadable label)
        console.warn(
          "[LabelScan] ⚠️ OCR returned null — check server logs and Network tab for /api/wine/scan"
        );
        onError?.(
          barcodeResult
            ? "Barcode scanned but not found in database. Label photo saved — enter details manually."
            : "Label photo saved. OCR unavailable or label unreadable — enter the name manually."
        );
      }

      // ── Path 3: Deliver whatever we have (photo + any partial fields) ────────
      console.log("[LabelScan] Delivering partial fields:", Object.keys(fields));
      onResult(fields);
    } catch (err) {
      console.error("[LabelScan] Unhandled scan error:", err);
      onError?.("Scan failed — label photo saved if available. Enter wine details manually.");
      if (fields.photoLink) onResult({ photoLink: fields.photoLink });
    } finally {
      setPhase(null);
      // Note: dataUrl is a data URL string (not an object URL), so no revocation needed.
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
          <>📷 Scan Label</>
        )}
      </Button>
    </>
  );
}

export default LabelScanButton;
