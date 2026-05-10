import React, { useState, useRef, useEffect, useCallback } from "react";
import { Form } from "react-bootstrap";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

/**
 * City autocomplete that calls the Mapbox Geocoding API.
 * Falls back gracefully to a plain text input if no token is configured.
 *
 * onLocationSelect is called with:
 *   { city, state, country, lat, lng }
 * where country is the ISO 2-letter code.
 */
function CityAutocomplete({ value, onChange, onLocationSelect, id, placeholder = "e.g. Tokyo", disabled, countryCode }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Sync external value changes (e.g. when editing an existing item)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q, activeCountryCode) => {
    if (!q || q.length < 2 || !MAPBOX_TOKEN) return;
    setLoading(true);
    try {
      const countryParam = activeCountryCode ? `&country=${activeCountryCode.toLowerCase()}` : "";
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place&limit=6${countryParam}&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowDropdown(true);
    } catch {
      // silently ignore geocoding errors
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange({ target: { name: "city", value: q } });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length >= 2 && MAPBOX_TOKEN) {
      debounceRef.current = setTimeout(() => fetchSuggestions(q, countryCode), 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (feature) => {
    const cityName = feature.text || feature.place_name.split(",")[0];
    setQuery(cityName);
    setSuggestions([]);
    setShowDropdown(false);

    onChange({ target: { name: "city", value: cityName } });

    if (onLocationSelect) {
      const [lng, lat] = feature.center || [];
      const context = feature.context || [];

      const stateCtx = context.find((c) => c.id?.startsWith("region."));
      const countryCtx = context.find((c) => c.id?.startsWith("country."));

      // Mapbox returns short_code like "US-TX" for regions or "us" for countries
      const countryCode = countryCtx?.short_code?.toUpperCase() || "";
      const stateName = stateCtx?.text || "";

      onLocationSelect({
        city: cityName,
        state: stateName,
        country: countryCode,
        lat: lat ? String(lat) : "",
        lng: lng ? String(lng) : "",
      });
    }
  };

  // If no Mapbox token, render a plain text input
  if (!MAPBOX_TOKEN) {
    return (
      <Form.Control
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <Form.Control
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {loading && (
        <div style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "0.75rem",
          color: "var(--color-text-tertiary)",
        }}>
          Searching…
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
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
          marginTop: "2px",
          maxHeight: "220px",
          overflowY: "auto",
        }}>
          {suggestions.map((feature) => {
            const parts = feature.place_name.split(", ");
            const city = parts[0];
            const rest = parts.slice(1).join(", ");
            return (
              <button
                key={feature.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(feature);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--color-border)",
                  fontSize: "var(--font-size-sm)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{city}</span>
                {rest && <span style={{ color: "var(--color-text-tertiary)", marginLeft: "0.35rem" }}>{rest}</span>}
              </button>
            );
          })}
          <div style={{
            padding: "0.3rem 0.75rem",
            fontSize: "0.65rem",
            color: "var(--color-text-tertiary)",
            borderTop: "1px solid var(--color-border)",
            textAlign: "right",
          }}>
            Powered by Mapbox
          </div>
        </div>
      )}
    </div>
  );
}

export default CityAutocomplete;
