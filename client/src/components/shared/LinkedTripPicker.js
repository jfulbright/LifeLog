import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import dataService from "../../services/dataService";
import { codeToFlag, getCountryName } from "../../data/countries";

/**
 * LinkedTripPicker — "Part of a Trip?" toggle + searchable trip selector.
 *
 * Renders a toggle. When turned on, shows a searchable dropdown of all travel
 * entries sorted by recency. If formDate falls within any trip's startDate–endDate
 * range, that trip floats to the top with a "Suggested" badge.
 *
 * On selection: calls onChange({ linkedTripId, linkedTripTitle, city?, country? })
 * so the parent form can update multiple fields at once.
 *
 * Props:
 *   linkedTripId    — current value of the linkedTripId field
 *   linkedTripTitle — current display title of the linked trip
 *   formDate        — activity/event startDate (ISO string) for proximity suggestion
 *   formCity        — current city value (to avoid overwriting if already set)
 *   formCountry     — current country value (to avoid overwriting if already set)
 *   onChange(patch) — called with { linkedTripId, linkedTripTitle, ...optional }
 *   readOnly        — when true renders just the linked trip name
 */
function LinkedTripPicker({
  linkedTripId,
  linkedTripTitle,
  formDate,
  formCity,
  formCountry,
  onChange,
  readOnly,
}) {
  const [trips, setTrips] = useState([]);
  const [enabled, setEnabled] = useState(!!linkedTripId);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!readOnly) {
      dataService.getItems("travel").then(setTrips);
    }
  }, [readOnly]);

  // Sync external linkedTripId changes (e.g. editing an existing item)
  useEffect(() => {
    setEnabled(!!linkedTripId);
  }, [linkedTripId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (readOnly) {
    if (!linkedTripTitle) return null;
    return (
      <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
        ✈️ {linkedTripTitle}
      </span>
    );
  }

  // Check if formDate falls within a trip's startDate–endDate range
  const isSuggested = (trip) => {
    if (!formDate || !trip.startDate) return false;
    const d = new Date(formDate + "T00:00:00");
    const start = new Date(trip.startDate + "T00:00:00");
    const end = trip.endDate ? new Date(trip.endDate + "T00:00:00") : start;
    return d >= start && d <= end;
  };

  const formatTripLabel = (trip) => {
    const flag = trip.country ? codeToFlag(trip.country) : "✈️";
    const country = trip.country ? getCountryName(trip.country) : "";
    const location = trip.city ? `${trip.city}, ${country}` : country;
    const year = trip.startDate
      ? new Date(trip.startDate + "T00:00:00").getFullYear()
      : "";
    return { flag, display: trip.title || location || "Untitled Trip", year };
  };

  // Sort: suggested first, then by most recent startDate
  const sortedTrips = [...trips].sort((a, b) => {
    const aS = isSuggested(a) ? 1 : 0;
    const bS = isSuggested(b) ? 1 : 0;
    if (bS !== aS) return bS - aS;
    return (b.startDate || "").localeCompare(a.startDate || "");
  });

  const filtered = query.trim()
    ? sortedTrips.filter((t) => {
        const q = query.toLowerCase();
        return (
          (t.title || "").toLowerCase().includes(q) ||
          (t.city || "").toLowerCase().includes(q) ||
          getCountryName(t.country || "").toLowerCase().includes(q)
        );
      })
    : sortedTrips;

  const handleToggle = (on) => {
    setEnabled(on);
    if (!on) {
      setQuery("");
      onChange({ linkedTripId: "", linkedTripTitle: "" });
    }
  };

  const handleSelect = (trip) => {
    setShowDropdown(false);
    setQuery("");
    const { display } = formatTripLabel(trip);
    const patch = {
      linkedTripId: trip.id,
      linkedTripTitle: trip.title || display,
    };
    // Auto-fill city/country only if not already set in the form
    if (!formCity && trip.city) patch.city = trip.city;
    if (!formCountry && trip.country) patch.country = trip.country;
    onChange(patch);
  };

  const handleClear = () => {
    onChange({ linkedTripId: "", linkedTripTitle: "" });
    setQuery("");
  };

  return (
    <div ref={wrapperRef}>
      {/* Toggle */}
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="linkedTripToggle"
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
        </div>
        <label
          htmlFor="linkedTripToggle"
          style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", cursor: "pointer", marginBottom: 0 }}
        >
          {enabled ? "Yes — linked to a trip" : "No — standalone"}
        </label>
      </div>

      {enabled && (
        <div>
          {/* Current selection or search */}
          {linkedTripId ? (
            <>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                background: "var(--color-surface-hover)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--card-radius)",
                fontSize: "var(--font-size-sm)",
              }}>
                <span>✈️</span>
                <span style={{ flex: 1, fontWeight: 600 }}>{linkedTripTitle}</span>
                <button
                  type="button"
                  onClick={handleClear}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "1rem", lineHeight: 1, padding: 0 }}
                  aria-label="Remove linked trip"
                >
                  ×
                </button>
              </div>
              {/* Location auto-fill hint */}
              {(() => {
                const linkedTrip = trips.find((t) => t.id === linkedTripId);
                if (!linkedTrip || (!linkedTrip.city && !linkedTrip.country)) return null;
                const flag = linkedTrip.country ? codeToFlag(linkedTrip.country) : "";
                const countryName = linkedTrip.country ? getCountryName(linkedTrip.country) : "";
                const locationText = linkedTrip.city
                  ? `${linkedTrip.city}${countryName ? `, ${countryName}` : ""}`
                  : countryName;
                return (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    marginTop: "0.4rem",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-secondary)",
                    padding: "0.2rem 0.1rem",
                  }}>
                    <span style={{ color: "var(--color-travel)", fontSize: "0.7rem" }}>✓</span>
                    <span>Location auto-filled from trip:</span>
                    <span style={{ fontWeight: 600 }}>{flag} {locationText}</span>
                  </div>
                );
              })()}
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <Form.Control
                type="text"
                placeholder="Search trips by name, city, or country…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                style={{ fontSize: "var(--font-size-sm)" }}
              />
              {showDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--card-radius)",
                  boxShadow: "var(--card-shadow-hover)",
                  marginTop: 2,
                  maxHeight: 240,
                  overflowY: "auto",
                }}>
                  {filtered.length === 0 && (
                    <div style={{ padding: "0.75rem", fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)" }}>
                      No trips found
                    </div>
                  )}
                  {filtered.map((trip) => {
                    const { flag, display, year } = formatTripLabel(trip);
                    const suggested = isSuggested(trip);
                    return (
                      <button
                        key={trip.id}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); handleSelect(trip); }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid var(--color-border)",
                          cursor: "pointer",
                          fontSize: "var(--font-size-sm)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                      >
                        <span style={{ fontSize: "1rem" }}>{flag}</span>
                        <span style={{ flex: 1, fontWeight: 600 }}>{display}</span>
                        {year && (
                          <span style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>{year}</span>
                        )}
                        {suggested && (
                          <span style={{
                            fontSize: "var(--font-size-xs)",
                            fontWeight: 700,
                            color: "#fff",
                            background: "var(--color-travel)",
                            borderRadius: 10,
                            padding: "0.1rem 0.4rem",
                            marginLeft: "0.25rem",
                          }}>
                            Suggested
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LinkedTripPicker;
