import React, { useState, useRef, useEffect, useCallback } from "react";
import { Form } from "react-bootstrap";
import { searchWhiskeys, fetchWhiskeyDetail, fetchDistilleryDetail } from "../../features/cellar/api/cellarApi";

const TYPE_ICONS = { expression: "🥃", distillery: "🏭", type: "📋", region: "🗺️" };
const SHOW_TYPES = ["expression", "distillery", "type", "region"];

/**
 * Whiskey name autocomplete backed by the WhiskeyFYI API.
 * Mirrors WineSearch.js in structure and behaviour.
 *
 * onWhiskeySelect is called with a partial formData object:
 *   { whiskyName, distillery, whiskyType, abv, ageStatement, nose, palate, finish, ... }
 */
function WhiskeySearch({ value, onChange, onWhiskeySelect, id, placeholder = "e.g. Buffalo Trace, Lagavulin…", disabled }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchOffline, setSearchOffline] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    setLoading(true);
    try {
      const results = await searchWhiskeys(q);
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
    onChange({ target: { name: "whiskyName", value: q } });

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
    onChange({ target: { name: "whiskyName", value: result.name } });

    if (!onWhiskeySelect) return;

    let fields = { whiskyName: result.name };

    if (result.type === "expression") {
      const detail = await fetchWhiskeyDetail(result.slug);
      if (detail) fields = { ...fields, ...detail };
      setShowDropdown(false);
      onWhiskeySelect(fields);
    } else if (result.type === "distillery") {
      const detail = await fetchDistilleryDetail(result.slug);
      if (detail) {
        fields = { distillery: detail.distillery, region: detail.region, country: detail.country };
      } else {
        fields = { distillery: result.name };
      }
      setShowDropdown(false);
      onWhiskeySelect(fields);
    } else if (result.type === "type") {
      fields = { ...fields, whiskyType: result.name };
      setShowDropdown(false);
      onWhiskeySelect(fields);
    } else if (result.type === "region") {
      fields = { ...fields, region: result.name };
      setShowDropdown(false);
      onWhiskeySelect(fields);
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
            Powered by WhiskeyFYI
          </div>
        </div>
      )}
    </div>
  );
}

export default WhiskeySearch;
