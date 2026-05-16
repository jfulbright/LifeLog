import React, { useState, useMemo } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import ItemForm from "../../../components/shared/ItemForm";
import MovieResultCard from "./MovieResultCard";
import SocialSearchPanel from "./SocialSearchPanel";
import RecommendationsPanel from "./RecommendationsPanel";
import SuggestedPanel from "./SuggestedPanel";
import movieSchema from "../movieSchema";
import { searchMovies } from "../api/movieApi";

const MODES = [
  { id: "search", label: "Search TMDB" },
  { id: "circles", label: "My Circles" },
  { id: "recs", label: "Recommendations" },
  { id: "suggested", label: "Suggested" },
];

function MovieForm({ formData, setFormData, onSubmit, onCancel, contacts, ownMovies }) {
  const [mode, setMode] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [manualEntry, setManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Build a lookup of social movies by tmdbId for enriching TMDB results
  const socialByTmdbId = useMemo(() => {
    if (!ownMovies) return {};
    const shared = (ownMovies || []).filter((m) => m._isShared && m.tmdbId);
    const map = {};
    shared.forEach((m) => {
      if (!map[m.tmdbId] || (m._socialRating || 0) > (map[m.tmdbId]._socialRating || 0)) {
        map[m.tmdbId] = m;
      }
    });
    return map;
  }, [ownMovies]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const movies = await searchMovies(query);
      setResults(movies);
      if (movies.length === 0) {
        setError("No results found. Try a different title.");
      }
    } catch (err) {
      console.error("Error searching movies:", err);
      setError(err.message || "Failed to search TMDB.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (movie, status) => {
    const updated = {
      ...movie,
      status: status || "watchlist",
      startDate: status === "watched" ? new Date().toISOString().slice(0, 10) : "",
    };
    // Strip social metadata fields before setting form data
    const { _socialSource, _sharedByName, _sharedByRing, _sharedByContactId, _sharedByUserId,
      _socialRating, _recId, _recommendedBy, _recommenderAvatar, _recommenderRing,
      _recommendedAt, _consensusCount, _tasteScore, _suggestedGenre, ...clean } = updated;
    setFormData(clean);
    setResults([]);
  };

  const handleBackToSearch = () => {
    setFormData({});
    setManualEntry(false);
    setResults([]);
  };

  if (formData?.title || manualEntry) {
    return (
      <div>
        <button
          className="item-card-toggle mb-3"
          onClick={handleBackToSearch}
        >
          &#8592; Back to Search
        </button>
        <ItemForm
          schema={movieSchema}
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          title="Movie"
          buttonText="Movie"
        />
      </div>
    );
  }

  return (
    <div>
      {/* Mode Tabs */}
      <div style={{
        display: "flex",
        gap: "0.3rem",
        marginBottom: "1rem",
        overflowX: "auto",
        paddingBottom: "0.25rem",
      }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: 18,
              border: `2px solid ${mode === m.id ? "var(--color-movies, #E91E63)" : "var(--color-border)"}`,
              background: mode === m.id ? "var(--color-movies, #E91E63)" : "transparent",
              color: mode === m.id ? "#fff" : "var(--color-text-secondary)",
              fontWeight: 600,
              fontSize: "var(--font-size-xs)",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {m.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setManualEntry(true)}
            style={{ fontSize: "var(--font-size-xs)" }}
          >
            Add Manually
          </Button>
        </div>
      </div>

      {/* Search TMDB Mode */}
      {mode === "search" && (
        <div>
          <div className="row g-2 mb-3">
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="Search by movie title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <Button
            variant="primary"
            className="w-100 mb-3"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Search"}
          </Button>

          {error && (
            <Alert variant="warning" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {results.length > 0 && (
            <div>
              <h6
                style={{
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.75rem",
                }}
              >
                Results
              </h6>
              {results.map((movie) => {
                const socialMatch = socialByTmdbId[movie.tmdbId];
                const badge = socialMatch
                  ? {
                      text: `${socialMatch._sharedByName || "Someone in your circles"} rated ${"★".repeat(parseInt(socialMatch.rating, 10) || 0)}`,
                      ringLevel: socialMatch._sharedByRing,
                    }
                  : null;

                return (
                  <MovieResultCard
                    key={movie.tmdbId}
                    movie={movie}
                    socialBadge={badge}
                    onSelect={handleSelect}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My Circles Mode */}
      {mode === "circles" && (
        <SocialSearchPanel
          contacts={contacts || []}
          ownMovies={ownMovies || []}
          onSelect={handleSelect}
        />
      )}

      {/* Recommendations Mode */}
      {mode === "recs" && (
        <RecommendationsPanel
          ownMovies={ownMovies || []}
          onSelect={handleSelect}
        />
      )}

      {/* Suggested Mode */}
      {mode === "suggested" && (
        <SuggestedPanel
          ownMovies={ownMovies || []}
          contacts={contacts || []}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}

export default MovieForm;
