import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import overlayService from "../../services/overlayService";

/**
 * Unified overlay form for adding personal perspective to any entry.
 * Works for both wishlist (why_notes) and experienced (snaps, rating, photos).
 * Used in category detail views AND SharedFeed -- single source of truth.
 */
function OverlayForm({ entryId, entryStatus, onSaved }) {
  const [snap1, setSnap1] = useState("");
  const [snap2, setSnap2] = useState("");
  const [snap3, setSnap3] = useState("");
  const [whyNotes, setWhyNotes] = useState("");
  const [rating, setRating] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const isWishlist = entryStatus === "wishlist";

  useEffect(() => {
    setLoading(true);
    overlayService.getMyOverlay(entryId).then((o) => {
      if (o) {
        setSnap1(o.snapshot1 || "");
        setSnap2(o.snapshot2 || "");
        setSnap3(o.snapshot3 || "");
        setWhyNotes(o.why_notes || "");
        setRating(o.rating ? String(o.rating) : "");
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [entryId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await overlayService.saveOverlay(entryId, {
        snapshot1: isWishlist ? "" : snap1,
        snapshot2: isWishlist ? "" : snap2,
        snapshot3: isWishlist ? "" : snap3,
        why_notes: whyNotes,
        rating: rating ? parseInt(rating) : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error("[OverlayForm] save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div>
      {/* Why notes (shown for all statuses) */}
      <Form.Group className="mb-3">
        <Form.Label style={{ fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
          {isWishlist ? "Why I'm interested" : "My thoughts / notes"}
        </Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          maxLength={500}
          value={whyNotes}
          onChange={(e) => setWhyNotes(e.target.value)}
          placeholder={isWishlist ? "What excites you about this?" : "Any notes or context..."}
          style={{ fontSize: "var(--font-size-sm)" }}
        />
      </Form.Group>

      {/* Snaps (only for experienced statuses) */}
      {!isWishlist && (
        <>
          {[
            { val: snap1, set: setSnap1, label: "Snap 1", placeholder: "A quick memory..." },
            { val: snap2, set: setSnap2, label: "Snap 2", placeholder: "A small detail..." },
            { val: snap3, set: setSnap3, label: "Snap 3", placeholder: "How it made you feel..." },
          ].map(({ val, set, label, placeholder }) => (
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
                placeholder={placeholder}
                style={{ fontSize: "var(--font-size-sm)" }}
              />
              <div style={{ textAlign: "right", fontSize: "0.65rem", color: "var(--color-text-tertiary)" }}>
                {val.length}/140
              </div>
            </Form.Group>
          ))}

          {/* Rating */}
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
      )}

      <div className="d-flex align-items-center gap-2">
        <Button size="sm" variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {saved && (
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", fontWeight: 600 }}>
            Saved!
          </span>
        )}
      </div>
    </div>
  );
}

export default OverlayForm;
