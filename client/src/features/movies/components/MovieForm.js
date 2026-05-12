import React, { useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import ItemForm from "../../../components/shared/ItemForm";
import movieSchema from "../movieSchema";
import { searchMovies } from "../api/movieApi";

function MovieForm({ formData, setFormData, onSubmit, onCancel }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [manualEntry, setManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setFormData(updated);
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Search TMDB
        </span>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setManualEntry(true)}
        >
          Add Manually
        </Button>
      </div>

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
          {results.map((movie) => (
            <div key={movie.tmdbId} className="search-result-card">
              <div className="d-flex gap-3 align-items-start">
                {movie.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    style={{
                      width: 50,
                      height: 75,
                      objectFit: "cover",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div className="flex-grow-1">
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {movie.title}
                  </strong>
                  {movie.year && (
                    <span className="text-muted"> ({movie.year})</span>
                  )}
                  {movie.genre && (
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-tertiary)",
                        marginTop: "0.2rem",
                      }}
                    >
                      {movie.genre}
                    </div>
                  )}
                  {movie.overview && (
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-secondary)",
                        marginTop: "0.25rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {movie.overview}
                    </div>
                  )}
                </div>
                <div className="d-flex flex-column gap-1 ms-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleSelect(movie, "watched")}
                  >
                    Watched
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    className="text-dark"
                    onClick={() => handleSelect(movie, "watchlist")}
                  >
                    Watchlist
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MovieForm;
