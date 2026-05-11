import React, { useRef } from "react";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

/**
 * A single photo upload slot: file picker → compress → Supabase Storage → preview.
 * Works on desktop (file dialog) and mobile (Camera / Photo Library sheet).
 *
 * Props:
 *   field      - schema field definition (used for label/name)
 *   value      - current photo URL (string) from formData
 *   onChange   - (url: string) => void — updates parent formData
 *   itemId     - formData.id, used to build the Supabase Storage path
 */
function PhotoUploadField({ field, value, onChange, itemId }) {
  const inputRef = useRef(null);
  const { uploadPhoto, uploading, uploadError, clearError } = usePhotoUpload();

  const handleFile = async (file) => {
    if (!file) return;
    clearError();
    const url = await uploadPhoto(file, itemId, field.name);
    if (url) onChange(url);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const openPicker = () => {
    clearError();
    inputRef.current?.click();
  };

  return (
    <div className="photo-upload-field">
      {value ? (
        /* ── Preview state ── */
        <div
          className="photo-upload-preview"
          onClick={openPicker}
          role="button"
          tabIndex={0}
          aria-label="Change photo"
          onKeyDown={(e) => e.key === "Enter" && openPicker()}
        >
          <img src={value} alt={field.label} className="photo-upload-preview-img" />
          <div className="photo-upload-preview-overlay">
            <span className="photo-upload-preview-hint">Change</span>
          </div>
          <button
            type="button"
            className="photo-upload-remove-btn"
            onClick={handleRemove}
            aria-label="Remove photo"
          >
            &times;
          </button>
        </div>
      ) : (
        /* ── Empty state ── */
        <button
          type="button"
          className={`photo-upload-trigger${uploading ? " uploading" : ""}`}
          onClick={openPicker}
          disabled={uploading}
          aria-label={`Upload ${field.label}`}
        >
          {uploading ? (
            <span className="photo-upload-spinner" aria-hidden="true" />
          ) : (
            <>
              <span className="photo-upload-icon" aria-hidden="true">📷</span>
              <span className="photo-upload-label">Add photo</span>
            </>
          )}
        </button>
      )}

      {/* Hidden file input — accept="image/*" triggers native camera/gallery on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {uploadError && (
        <div className="photo-upload-error" role="alert">
          {uploadError}
        </div>
      )}
    </div>
  );
}

export default PhotoUploadField;
