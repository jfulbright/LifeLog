import React, { useState, useRef, useEffect, useCallback } from "react";
import { Form } from "react-bootstrap";
import { searchWines, fetchWineDetail, fetchWineryDetail } from "../../features/wines/api/wineApi";

const TYPE_ICONS = { wine: "🍷", grape: "🍇", winery: "🏠", region: "🗺️" };
const SHOW_TYPES = ["wine", "winery", "grape", "region"];

function normalizeWineType(raw) {
  if (!raw) return "";
  const map = {
    Red: "Red", White: "White", "Rosé": "Rosé",
    Sparkling: "Sparkling", Dessert: "Dessert", Fortified: "Fortified", Orange: "Orange",
  };
  return map[raw] || raw;
}

/**
 * Wine name autocomplete backed by the VinoFYI API.
 * Mirrors CityAutocomplete.js in structure and behaviour.
 *
 * onWineSelect is called with a partial formData object:
 *   { wineName, winery, wineType, region, varietal }
 */
function WineSearch({ value, onChange, onWineSelect, id, placeholder = "e.g. Opus One, Caymus, Barolo…", disabled }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchOffline, setSearchOffline] = useState(false);
  const [wineryWines, setWineryWines] = useState(null); // { wineryName, wines[] }
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setWineryWines(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    setLoading(true);
    try {
      const results = await searchWines(q);
      setSearchOffline(false);
      const filtered = results.filter((r) => SHOW_TYPES.includes(r.type)).slice(0, 8);
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    } catch (err) {
      if (err.code === "unavailable") setSearchOffline(true);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setWineryWines(null);
    onChange({ target: { name: "wineName", value: q } });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length >= 2) {
      debounceRef.current = setTimeout(() => fetchSuggestions(q), 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = async (result) => {
    setQuery(result.name);
    setSuggestions([]);
    setWineryWines(null);
    onChange({ target: { name: "wineName", value: result.name } });

    if (!onWineSelect) return;

    let fields = { wineName: result.name };

    if (result.type === "wine") {
      const detail = await fetchWineDetail(result.slug);
      if (detail) fields = { ...fields, ...detail };
      setShowDropdown(false);
      onWineSelect(fields);
    } else if (result.type === "winery") {
      const detail = await fetchWineryDetail(result.slug);
      if (detail) {
        fields = { winery: detail.winery, region: detail.region, country: detail.country };
        onWineSelect(fields);
        setQuery("");
        onChange({ target: { name: "wineName", value: "" } });
        // Show sub-picker with this winery's top wines
        if (detail.topWines?.length > 0) {
          setWineryWines({ wineryName: detail.winery, wines: detail.topWines });
          setShowDropdown(true);
        } else {
          setShowDropdown(false);
        }
      } else {
        fields = { ...fields, winery: result.name };
        setShowDropdown(false);
        onWineSelect(fields);
      }
    } else if (result.type === "grape") {
      fields = { ...fields, varietal: result.name };
      setShowDropdown(false);
      onWineSelect(fields);
    } else if (result.type === "region") {
      fields = { ...fields, region: result.name };
      setShowDropdown(false);
      onWineSelect(fields);
    }
  };

  const handleWineryWineSelect = async (wine) => {
    setWineryWines(null);
    setShowDropdown(false);
    setQuery(wine.name);
    onChange({ target: { name: "wineName", value: wine.name } });

    if (!onWineSelect) return;
    const detail = await fetchWineDetail(wine.slug);
    if (detail) {
      onWineSelect(detail);
    } else {
      onWineSelect({ wineName: wine.name, wineType: normalizeWineType(wine.wineType) });
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {searchOffline && (
        <div style={{
          fontSize: "0.7rem",
          color: "var(--color-text-tertiary)",
          marginBottom: "0.25rem",
        }}>
          Search unavailable on this network — type the name below
        </div>
      )}
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
          pointerEvents: "none",
        }}>
          Searching…
        </div>
      )}

      {showDropdown && wineryWines && (
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
          maxHeight: "280px",
          overflowY: "auto",
        }}>
          <div style={{
            padding: "0.4rem 0.75rem",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            borderBottom: "1px solid var(--color-border)",
          }}>
            Wines from {wineryWines.wineryName}:
          </div>
          {wineryWines.wines.map((wine) => (
            <button
              key={wine.slug}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleWineryWineSelect(wine);
              }}
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
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>🍷</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {wine.name}
                </span>
              </div>
              {wine.wineType && (
                <span style={{
                  fontSize: "0.65rem",
                  padding: "0.15rem 0.4rem",
                  borderRadius: "10px",
                  background: "rgba(139,58,143,0.1)",
                  color: "var(--color-wines, #8B3A8F)",
                  fontWeight: 600,
                }}>
                  {wine.wineType}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showDropdown && !wineryWines && suggestions.length > 0 && (
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
          maxHeight: "260px",
          overflowY: "auto",
        }}>
          {suggestions.map((result) => (
            <button
              key={`${result.type}-${result.slug}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(result);
              }}
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
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>
                {TYPE_ICONS[result.type] || "📋"}
              </span>
              <div>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {result.name}
                </span>
                <span style={{
                  marginLeft: "0.4rem",
                  fontSize: "0.7rem",
                  color: "var(--color-text-tertiary)",
                  textTransform: "capitalize",
                }}>
                  {result.type}
                </span>
              </div>
            </button>
          ))}
          <div style={{
            padding: "0.3rem 0.75rem",
            fontSize: "0.65rem",
            color: "var(--color-text-tertiary)",
            borderTop: "1px solid var(--color-border)",
            textAlign: "right",
          }}>
            Powered by VinoFYI
          </div>
        </div>
      )}
    </div>
  );
}

export default WineSearch;
