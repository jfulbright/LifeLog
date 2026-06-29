import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { Form } from "react-bootstrap";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

/**
 * City autocomplete that calls the Mapbox Geocoding API.
 * Falls back gracefully to a plain text input if no token is configured.
 *
 * onLocationSelect is called with:
 *   { city, state, country, lat, lng }
 * where country is the ISO 2-letter code.
 *
 * The suggestion dropdown is rendered via a React portal on document.body
 * so it escapes any ancestor overflow:hidden/auto context (e.g. Offcanvas panels).
 */
function CityAutocomplete({ value, onChange, onLocationSelect, id, placeholder = "e.g. Tokyo", disabled, countryCode, autoGeocode = false, hasCoords = false }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  // -1 = no keyboard selection yet (typed text wins on Enter)
  const [activeIndex, setActiveIndex] = useState(-1);
  // Viewport-relative position of the input, used to place the portalled dropdown.
  const [dropdownStyle, setDropdownStyle] = useState({});
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  // Tracks the query we've already resolved to coordinates so a blur after an
  // explicit pick (or a previous blur-geocode) doesn't fire a duplicate lookup.
  const lastResolvedQuery = useRef(null);

  // Sync external value changes (e.g. when editing an existing item).
  // When the incoming value already has coordinates, treat it as resolved so an
  // immediate blur (e.g. tabbing through) doesn't re-geocode. A later edit that
  // changes the text will no longer match and will re-resolve — moving the pin.
  useEffect(() => {
    setQuery(value || "");
    if (hasCoords && value) {
      lastResolvedQuery.current = value.trim().toLowerCase();
    }
  }, [value, hasCoords]);

  // Close dropdown when clicking outside. Also listens for scroll/resize so
  // the portalled dropdown doesn't linger in the wrong position.
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    function handleScrollOrResize() {
      setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  // Recalculate the dropdown's fixed position whenever it becomes visible so it
  // tracks the input even when rendered inside a scrollable panel.
  useEffect(() => {
    if (showDropdown && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 2,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
  }, [showDropdown]);

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
      setActiveIndex(-1);
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

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        break;
      case "Enter":
        // Only intercept Enter when a suggestion is highlighted, so a user who
        // typed a custom city can still submit the form / blur-geocode freely.
        if (activeIndex >= 0) {
          e.preventDefault();
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSelect = (feature) => {
    const cityName = feature.text || feature.place_name.split(",")[0];
    setQuery(cityName);
    setSuggestions([]);
    setShowDropdown(false);
    lastResolvedQuery.current = cityName.trim().toLowerCase();

    onChange({ target: { name: "city", value: cityName } });

    if (onLocationSelect) {
      const [lng, lat] = feature.center || [];
      const context = feature.context || [];

      const stateCtx = context.find((c) => c.id?.startsWith("region."));
      const countryCtx = context.find((c) => c.id?.startsWith("country."));

      // Mapbox returns short_code like "US-TX" for regions or "us" for countries
      const countryCode = countryCtx?.short_code?.toUpperCase() || "";

      // For US/CA the StateDropdown is keyed by abbreviation (e.g. "TX"), so we
      // must derive it from the region short_code ("US-TX" -> "TX"). Using the
      // region's full text ("Texas") would not match any option and the field
      // would render blank. Other countries use a free-text region input where
      // the full name is the right value.
      const regionShort = stateCtx?.short_code || ""; // e.g. "US-TX"
      const usesAbbrev = countryCode === "US" || countryCode === "CA";
      const stateAbbr = regionShort.includes("-") ? regionShort.split("-")[1] : "";
      const stateValue = usesAbbrev && stateAbbr ? stateAbbr : stateCtx?.text || "";

      onLocationSelect({
        city: cityName,
        state: stateValue,
        country: countryCode,
        lat: lat ? String(lat) : "",
        lng: lng ? String(lng) : "",
      });
    }
  };

  // When a location form needs map coordinates but the user typed a city
  // without picking a suggestion, resolve the best match on blur so the entry
  // still gets lat/lng (and therefore a map pin). We key off whether the text
  // changed since it was last resolved — not merely whether coords already
  // exist — so editing the city of an existing entry moves the pin instead of
  // leaving it stranded at the previous city's coordinates.
  const handleBlur = async () => {
    if (!autoGeocode || !MAPBOX_TOKEN) return;
    const q = query.trim();
    if (q.length < 2) return;
    if (lastResolvedQuery.current === q.toLowerCase()) return;
    try {
      const countryParam = countryCode ? `&country=${countryCode.toLowerCase()}` : "";
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place&limit=1${countryParam}&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const best = (data.features || [])[0];
      if (best) handleSelect(best);
    } catch {
      // silently ignore geocoding errors
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

  const listboxId = id ? `${id}-listbox` : undefined;
  const activeOptionId =
    id && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined;

  const dropdown = showDropdown && suggestions.length > 0
    ? ReactDOM.createPortal(
        <div id={listboxId} role="listbox" style={{
          ...dropdownStyle,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--card-radius)",
          boxShadow: "var(--card-shadow-hover)",
          maxHeight: "220px",
          overflowY: "auto",
        }}>
          {suggestions.map((feature, index) => {
            const parts = feature.place_name.split(", ");
            const city = parts[0];
            const rest = parts.slice(1).join(", ");
            const isActive = index === activeIndex;
            return (
              <button
                key={feature.id}
                id={id ? `${id}-option-${index}` : undefined}
                role="option"
                aria-selected={isActive}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(feature);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.5rem 0.75rem",
                  background: isActive ? "var(--color-surface-hover)" : "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: "1px solid var(--color-border)",
                  fontSize: "var(--font-size-sm)",
                }}
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
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <Form.Control
        id={id}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown && suggestions.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
      />
      {loading && (
        <div style={{
          position: "absolute",
          right: "0.75rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "0.75rem",
          color: "var(--color-text-tertiary)",
          pointerEvents: "none",
        }}>
          Searching…
        </div>
      )}
      {dropdown}
    </div>
  );
}

export default CityAutocomplete;
