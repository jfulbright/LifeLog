import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * Multi-dimensional pill filter. Unlike GroupedDropdownFilter (one active value
 * across the whole row), every pill here holds its OWN value and selections
 * stack — e.g. Wine + Red + 4★ at once. Pills can also be contextual: a pill is
 * hidden unless its optional `visibleWhen(values)` returns true.
 *
 * Props:
 * - pills: [{
 *     key,                 // unique id, also the key in the `values` map
 *     label,               // pill button text
 *     options: [{ value, label }],
 *     value,               // this pill's current value ("all" = unset)
 *     onChange(value),     // called when the user picks an option / clears
 *     allLabel,            // optional reset-option label (default derived from label)
 *     color,               // optional accent (falls back to `color` prop)
 *     visibleWhen(values), // optional; values = { [key]: value } for all pills
 *   }]
 * - color: default accent color for pills
 */
export default function MultiPillFilter({ pills, color = "var(--color-primary)" }) {
  const [openKey, setOpenKey] = useState(null);
  const containerRef = useRef(null);
  const leaveTimerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenKey(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => () => clearTimeout(leaveTimerRef.current), []);

  const handleMouseEnter = useCallback((key) => {
    clearTimeout(leaveTimerRef.current);
    setOpenKey(key);
  }, []);

  const handleMouseLeave = useCallback((key) => {
    leaveTimerRef.current = setTimeout(() => {
      setOpenKey((current) => (current === key ? null : current));
    }, 150);
  }, []);

  const values = Object.fromEntries(pills.map((p) => [p.key, p.value]));
  const visiblePills = pills.filter((p) => (p.visibleWhen ? p.visibleWhen(values) : true));

  return (
    <div
      ref={containerRef}
      className="d-flex gap-2 flex-wrap mb-3"
      style={{ position: "relative" }}
    >
      {visiblePills.map((pill) => {
        const accent = pill.color || color;
        const isActive = pill.value && pill.value !== "all";
        const resetLabel = pill.allLabel || `All ${pill.label.replace(/^[^\w]*/, "").trim()}`;

        return (
          <div
            key={pill.key}
            style={{ display: "inline-block", position: "relative" }}
            onMouseEnter={() => handleMouseEnter(pill.key)}
            onMouseLeave={() => handleMouseLeave(pill.key)}
          >
            <button
              type="button"
              onClick={() => setOpenKey(openKey === pill.key ? null : pill.key)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "20px",
                border: `2px solid ${accent}`,
                background: isActive ? accent : "transparent",
                color: isActive ? "#fff" : accent,
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
              }}
            >
              {pill.label}
            </button>

            {openKey === pill.key && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, paddingTop: 4 }}>
                <div
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--card-radius)",
                    padding: "0.5rem",
                    boxShadow: "var(--card-shadow-hover)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    minWidth: 160,
                  }}
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { pill.onChange("all"); setOpenKey(null); }}
                    style={{
                      textAlign: "left",
                      padding: "0.3rem 0.5rem",
                      border: "none",
                      background: !isActive ? "var(--color-surface-hover)" : "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: !isActive ? 700 : 400,
                      color: "var(--color-text-secondary)",
                      borderBottom: "1px solid var(--color-border)",
                      marginBottom: "0.25rem",
                      paddingBottom: "0.4rem",
                    }}
                  >
                    {resetLabel}
                  </button>
                  {pill.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { pill.onChange(opt.value); setOpenKey(null); }}
                      style={{
                        textAlign: "left",
                        padding: "0.3rem 0.5rem",
                        border: "none",
                        background: pill.value === opt.value ? "var(--color-surface-hover)" : "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: pill.value === opt.value ? 700 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
