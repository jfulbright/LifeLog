import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Avatar from "./Avatar";

/**
 * Renders 1–3 photo URLs in an equal-width horizontal strip.
 * Clicking any thumbnail opens a full-screen carousel lightbox.
 *
 * Props:
 *   photos          string[]                    Thumbnail URLs (up to 3, shown in grid)
 *   lightboxPhotos  {url, label?, avatarUrl?}[] Full carousel set (own + shared).
 *                                               Defaults to `photos` if not provided.
 *   height          number                      Thumbnail strip height in px (default 160)
 *   className       string
 */
function PhotoGrid({ photos, lightboxPhotos: lightboxPhotosProp, height = 160, className = "" }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const touchStartX = useRef(null);

  const validPhotos = (photos || []).filter(Boolean).slice(0, 3);

  // Full carousel set — prefer explicit prop, fall back to own photos
  const carouselPhotos =
    lightboxPhotosProp?.length > 0
      ? lightboxPhotosProp
      : validPhotos.map((url) => ({ url }));

  const isOpen = lightboxIdx !== null;
  const current = isOpen ? carouselPhotos[lightboxIdx] : null;
  const total = carouselPhotos.length;

  const prev = () => setLightboxIdx((i) => (i - 1 + total) % total);
  const next = () => setLightboxIdx((i) => (i + 1) % total);
  const close = () => setLightboxIdx(null);

  const openAt = (url) => {
    const idx = carouselPhotos.findIndex((p) => p.url === url);
    setLightboxIdx(idx >= 0 ? idx : 0);
  };

  // Keyboard: ← → Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, total]);

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
            onClick={() => openAt(url)}
            role="button"
            tabIndex={0}
            aria-label={`View photo ${i + 1}`}
            onKeyDown={(e) => e.key === "Enter" && openAt(url)}
          >
            <img
              src={url}
              alt={`Moment ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>

      {/* Carousel lightbox — portalled to body to avoid Bootstrap Modal stacking-context flicker */}
      {isOpen && ReactDOM.createPortal(
        <div
          className="photo-lightbox-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX.current;
            touchStartX.current = null;
            if (Math.abs(dx) < 50) return;
            dx < 0 ? next() : prev();
          }}
        >
          {/* Close */}
          <button className="photo-lightbox-close" onClick={close} aria-label="Close">
            &times;
          </button>

          {/* Prev arrow */}
          {total > 1 && (
            <button
              className="photo-lightbox-arrow photo-lightbox-arrow--prev"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous photo"
            >
              &#8249;
            </button>
          )}

          {/* Image */}
          <img
            src={current.url}
            alt="Expanded view"
            className="photo-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          {total > 1 && (
            <button
              className="photo-lightbox-arrow photo-lightbox-arrow--next"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next photo"
            >
              &#8250;
            </button>
          )}

          {/* Caption bar: attribution + counter */}
          {(current.label || total > 1) && (
            <div className="photo-lightbox-caption" onClick={(e) => e.stopPropagation()}>
              {current.label && (
                <div className="photo-lightbox-attribution">
                  <Avatar
                    displayName={current.label}
                    avatarUrl={current.avatarUrl}
                    size={22}
                    style={{ flexShrink: 0 }}
                  />
                  <span className="photo-lightbox-attribution-name">{current.label}</span>
                </div>
              )}
              {total > 1 && (
                <span className="photo-lightbox-counter">{lightboxIdx + 1} / {total}</span>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

export default PhotoGrid;
