import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import overlayService from "../../services/overlayService";
import { useSocialData } from "../../contexts/SocialDataContext";
import PhotoUploadField from "./PhotoUploadField";

/**
 * Unified overlay form for adding personal perspective to any entry.
 * Works for both wishlist (why_notes) and experienced (snaps, rating, photos).
 * Used in category detail views AND SharedFeed -- single source of truth.
 */
const FUTURE_STATUSES = ["wishlist", "watchlist", "want-to", "planned"];

function OverlayForm({ entryId, entryStatus, onSaved, onCancel, initialOverlay, showPhotos = false }) {
  const { incrementVersion } = useSocialData();
  const [snap1, setSnap1] = useState("");
  const [snap2, setSnap2] = useState("");
  const [snap3, setSnap3] = useState("");
  const [whyNotes, setWhyNotes] = useState("");
  const [rating, setRating] = useState("");
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(!initialOverlay);

  const isWishlist = FUTURE_STATUSES.includes(entryStatus);

  const setPhotoAt = (index, url) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  };

  useEffect(() => {
    if (initialOverlay) {
      setSnap1(initialOverlay.snapshot1 || "");
      setSnap2(initialOverlay.snapshot2 || "");
      setSnap3(initialOverlay.snapshot3 || "");
      setWhyNotes(initialOverlay.why_notes || "");
      setRating(initialOverlay.rating ? String(initialOverlay.rating) : "");
      setPhotos(Array.isArray(initialOverlay.photos) ? initialOverlay.photos.filter(Boolean) : []);
      return;
    }
    setLoading(true);
    overlayService.getMyOverlay(entryId).then((o) => {
      if (o) {
        setSnap1(o.snapshot1 || "");
        setSnap2(o.snapshot2 || "");
        setSnap3(o.snapshot3 || "");
        setWhyNotes(o.why_notes || "");
        setRating(o.rating ? String(o.rating) : "");
        setPhotos(Array.isArray(o.photos) ? o.photos.filter(Boolean) : []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [entryId, initialOverlay]);

  const handleSave = async () => {
    if (!entryId) {
      setSaveError("Missing entry ID — cannot save.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await overlayService.saveOverlay(entryId, {
        snapshot1: isWishlist ? "" : snap1,
        snapshot2: isWishlist ? "" : snap2,
        snapshot3: isWishlist ? "" : snap3,
        why_notes: whyNotes,
        rating: rating ? parseInt(rating) : null,
        ...(showPhotos && { photos: photos.filter(Boolean) }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      incrementVersion();
      if (onSaved) onSaved();
    } catch (err) {
      console.error("[OverlayForm] save failed:", err);
      setSaveError(err.message || "Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div>
      {isWishlist ? (
        <>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
              Why I'm interested
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={500}
              value={whyNotes}
              onChange={(e) => setWhyNotes(e.target.value)}
              placeholder="What excites you about this?"
              style={{ fontSize: "var(--font-size-sm)" }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
              Your Rating
            </Form.Label>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(String(star))}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: star <= parseInt(rating || "0") ? "#f5a623" : "#ccc",
                  }}
                >
                  {star <= parseInt(rating || "0") ? "\u2605" : "\u2606"}
                </button>
              ))}
            </div>
          </Form.Group>
        </>
      ) : (
        <>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
              Your Rating
            </Form.Label>
            <div className="d-flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(String(star))}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: star <= parseInt(rating || "0") ? "#f5a623" : "#ccc",
                  }}
                >
                  {star <= parseInt(rating || "0") ? "\u2605" : "\u2606"}
                </button>
              ))}
            </div>
          </Form.Group>

          {[
            { val: snap1, set: setSnap1, label: "Snap 1" },
            { val: snap2, set: setSnap2, label: "Snap 2" },
            { val: snap3, set: setSnap3, label: "Snap 3" },
          ].map(({ val, set, label }) => (
            <Form.Group key={label} className="mb-2">
              <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                {label}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={1}
                maxLength={140}
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder="A quick memory..."
                style={{ fontSize: "var(--font-size-sm)" }}
              />
              <div style={{ textAlign: "right", fontSize: "0.65rem", color: "var(--color-text-tertiary)" }}>
                {val.length}/140
              </div>
            </Form.Group>
          ))}
        </>
      )}

      {showPhotos && (
        <div className="mb-2">
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "0.375rem" }}>
            Photos
          </div>
          <div className="row g-2">
            {[0, 1, 2].map((index) => (
              <div className="col-4" key={index}>
                <PhotoUploadField
                  field={{ name: `overlayPhoto${index + 1}`, label: `Photo ${index + 1}` }}
                  value={photos[index] || ""}
                  onChange={(url) => setPhotoAt(index, url)}
                  itemId={entryId}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="d-flex align-items-center gap-2">
        <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {onCancel && (
          <Button size="sm" variant="outline-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        {saved && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", fontWeight: 600 }}>
            Saved!
          </span>
        )}
        {saveError && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-danger)", fontWeight: 600 }}>
            {saveError}
          </span>
        )}
      </div>
    </div>
  );
}

export default OverlayForm;
