import React, { useState, useEffect, useMemo } from "react";
import { Spinner } from "react-bootstrap";
import MovieResultCard from "./MovieResultCard";
import { getSocialMovies } from "../api/socialMovieApi";
import { RING_META, RING_LEVELS } from "../../../helpers/ringMeta";

const RATING_OPTIONS = [
  { value: 0, label: "Any" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 5, label: "5 only" },
];

function SocialSearchPanel({ contacts, ownMovies, onSelect }) {
  const [selectedRings, setSelectedRings] = useState([1, 2, 3, 4]);
  const [minRating, setMinRating] = useState(3);
  const [hideWatched, setHideWatched] = useState(true);
  const [selectedContact, setSelectedContact] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const linkedContacts = useMemo(
    () => (contacts || []).filter((c) => c.linkedUserId && selectedRings.includes(c.ringLevel)),
    [contacts, selectedRings]
  );

  const ownTmdbIds = useMemo(
    () => ownMovies.map((m) => m.tmdbId).filter(Boolean),
    [ownMovies]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const movies = await getSocialMovies({
        ringLevels: selectedRings,
        minRating,
        excludeTmdbIds: hideWatched ? ownTmdbIds : [],
        contactId: selectedContact || null,
      }).catch(() => []);

      if (!cancelled) {
        setResults(movies);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedRings, minRating, hideWatched, selectedContact, ownTmdbIds]);

  const toggleRing = (level) => {
    setSelectedRings((prev) =>
      prev.includes(level) ? prev.filter((r) => r !== level) : [...prev, level]
    );
  };

  return (
    <div>
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>
          From Rings
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {RING_LEVELS.map((level) => {
            const meta = RING_META[level];
            const active = selectedRings.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleRing(level)}
                style={{
                  padding: "0.25rem 0.7rem",
                  borderRadius: 16,
                  border: `1.5px solid ${active ? meta.color : "var(--color-border)"}`,
                  background: active ? meta.color : "transparent",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: "var(--font-size-xs)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: "0.25rem" }}>
            Min Rating
          </div>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMinRating(opt.value)}
                style={{
                  padding: "0.2rem 0.5rem",
                  borderRadius: 12,
                  border: `1.5px solid ${minRating === opt.value ? "var(--color-movies, #E91E63)" : "var(--color-border)"}`,
                  background: minRating === opt.value ? "var(--color-movies, #E91E63)" : "transparent",
                  color: minRating === opt.value ? "#fff" : "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: "var(--font-size-xs)",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={hideWatched}
            onChange={(e) => setHideWatched(e.target.checked)}
            style={{ accentColor: "var(--color-movies, #E91E63)" }}
          />
          Hide movies I've seen
        </label>
      </div>

      {linkedContacts.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <select
            className="form-select form-select-sm"
            value={selectedContact}
            onChange={(e) => setSelectedContact(e.target.value)}
            style={{ maxWidth: 220, fontSize: "var(--font-size-xs)" }}
          >
            <option value="">All people in selected rings</option>
            {linkedContacts.map((c) => (
              <option key={c.id} value={c.id}>{c.displayName}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
          No movies found matching these filters. Try expanding your ring selection or lowering the rating minimum.
        </div>
      ) : (
        <div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "0.5rem" }}>
            {results.length} movie{results.length !== 1 ? "s" : ""} from your circles
          </div>
          {results.slice(0, 20).map((movie) => (
            <MovieResultCard
              key={movie.id}
              movie={movie}
              socialBadge={{
                text: `Rated ${"★".repeat(movie._socialRating || 0)} by ${movie._sharedByName}`,
                ringLevel: movie._sharedByRing,
              }}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SocialSearchPanel;
