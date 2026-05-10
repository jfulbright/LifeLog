import React, { useState } from "react";

/**
 * Renders 1–3 photo URLs in an equal-width horizontal strip.
 * Used in item cards, itinerary headers, and the Memories page.
 *
 * @param {string[]} photos - Array of image URLs (up to 3)
 * @param {number} height - Height of each photo cell in px (default 160)
 * @param {string} className - Additional CSS class names
 */
function PhotoGrid({ photos, height = 160, className = "" }) {
  const [lightbox, setLightbox] = useState(null);
  const validPhotos = (photos || []).filter(Boolean).slice(0, 3);

  if (validPhotos.length === 0) return null;

  const colStyle = {
    flex: 1,
    height,
    overflow: "hidden",
    borderRadius: "var(--card-radius)",
    cursor: "pointer",
    position: "relative",
  };

  return (
    <>
      <div
        className={`photo-grid ${className}`}
        style={{ display: "flex", gap: "0.375rem" }}
      >
        {validPhotos.map((url, i) => (
          <div
            key={i}
            style={colStyle}
            onClick={() => setLightbox(url)}
            role="button"
            tabIndex={0}
            aria-label={`View photo ${i + 1}`}
            onKeyDown={(e) => e.key === "Enter" && setLightbox(url)}
          >
            <img
              src={url}
              alt={`Moment ${i + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ))}
      </div>

      {/* Inline lightbox overlay */}
      {lightbox && (
        <div
          className="photo-lightbox-overlay"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          <button
            className="photo-lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <img
            src={lightbox}
            alt="Expanded view"
            className="photo-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default PhotoGrid;
