import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import MovieResultCard from "./MovieResultCard";
import { getMovieRecommendationsEnriched } from "../api/socialMovieApi";
import recommendationService from "../../../services/recommendationService";
import { RING_META } from "../../../helpers/ringMeta";

function RecommendationsPanel({ ownMovies, onSelect }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ringFilter, setRingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await getMovieRecommendationsEnriched().catch(() => []);
      if (!cancelled) {
        setRecs(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const ownTmdbIds = new Set(ownMovies.filter((m) => m.status === "watched").map((m) => m.tmdbId).filter(Boolean));

  const filtered = recs
    .filter((r) => {
      if (ringFilter !== "all" && r._recommenderRing !== parseInt(ringFilter, 10)) return false;
      if (r.tmdbId && ownTmdbIds.has(r.tmdbId)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return (b._socialRating || 0) - (a._socialRating || 0);
      return new Date(b._recommendedAt) - new Date(a._recommendedAt);
    });

  const handleDismiss = async (recId) => {
    try {
      await recommendationService.dismissRecommendation(recId);
      setRecs((prev) => prev.filter((r) => r._recId !== recId));
    } catch (err) {
      console.error("Failed to dismiss:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: "0.2rem" }}>
            From
          </div>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <FilterPill label="All" active={ringFilter === "all"} onClick={() => setRingFilter("all")} />
            {[1, 2, 3, 4].map((level) => (
              <FilterPill
                key={level}
                label={`${RING_META[level].emoji} ${RING_META[level].label}`}
                active={ringFilter === String(level)}
                onClick={() => setRingFilter(String(level))}
              />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: "0.2rem" }}>
            Sort
          </div>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <FilterPill label="Newest" active={sortBy === "newest"} onClick={() => setSortBy("newest")} />
            <FilterPill label="Highest rated" active={sortBy === "rating"} onClick={() => setSortBy("rating")} />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
          {recs.length === 0
            ? "No movie recommendations yet. When friends recommend movies to you, they'll appear here."
            : "No recommendations match this filter."}
        </div>
      ) : (
        <div>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "0.5rem" }}>
            {filtered.length} recommendation{filtered.length !== 1 ? "s" : ""}
          </div>
          {filtered.map((rec) => (
            <MovieResultCard
              key={rec.id}
              movie={rec}
              socialBadge={{
                text: `Recommended by ${rec._recommendedBy}`,
                ringLevel: rec._recommenderRing,
                avatar: rec._recommenderAvatar,
              }}
              onSelect={onSelect}
              actions={
                <div className="d-flex flex-column gap-1">
                  <Button size="sm" variant="success" onClick={() => onSelect(rec, "watched")}>
                    Watched
                  </Button>
                  <Button size="sm" variant="outline-warning" className="text-dark" onClick={() => onSelect(rec, "watchlist")}>
                    Watchlist
                  </Button>
                  <Button size="sm" variant="outline-secondary" onClick={() => handleDismiss(rec._recId)}>
                    Dismiss
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.2rem 0.5rem",
        borderRadius: 12,
        border: `1.5px solid ${active ? "var(--color-movies, #E91E63)" : "var(--color-border)"}`,
        background: active ? "var(--color-movies, #E91E63)" : "transparent",
        color: active ? "#fff" : "var(--color-text-secondary)",
        fontWeight: 600,
        fontSize: "var(--font-size-xs)",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default RecommendationsPanel;
