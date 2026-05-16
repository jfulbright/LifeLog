import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import MovieResultCard from "./MovieResultCard";
import { getSuggestedMovies } from "../api/socialMovieApi";

function SuggestedPanel({ ownMovies, contacts, onSelect }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await getSuggestedMovies(ownMovies, contacts).catch(() => ({
        consensus: [],
        tasteMatch: [],
        genreAffinity: [],
      }));
      if (!cancelled) {
        setSuggestions(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [ownMovies, contacts]);

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" />
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.5rem" }}>
          Analyzing your circles' taste...
        </div>
      </div>
    );
  }

  const hasContent = suggestions &&
    (suggestions.consensus.length > 0 || suggestions.tasteMatch.length > 0 || suggestions.genreAffinity.length > 0);

  if (!hasContent) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
        Not enough social data to generate suggestions yet. As your circles add and rate movies, personalized picks will appear here.
      </div>
    );
  }

  return (
    <div>
      {suggestions.consensus.length > 0 && (
        <SuggestionSection
          title="Consensus Picks"
          subtitle="Highly rated by multiple people in your circles"
          movies={suggestions.consensus}
          badgeBuilder={(m) => ({
            text: `${m._consensusCount} people rated 4+`,
            ringLevel: m._sharedByRing,
          })}
          onSelect={onSelect}
        />
      )}

      {suggestions.tasteMatch.length > 0 && (
        <SuggestionSection
          title={`Based on ${suggestions.tasteMatchContact || "your closest match"}'s taste`}
          subtitle="Your ratings align closely -- you'll likely enjoy these too"
          movies={suggestions.tasteMatch}
          badgeBuilder={(m) => ({
            text: `Rated ${"★".repeat(m._socialRating || 0)} by ${m._sharedByName}`,
            ringLevel: m._sharedByRing,
          })}
          onSelect={onSelect}
        />
      )}

      {suggestions.genreAffinity.length > 0 && (
        <SuggestionSection
          title={`Explore ${suggestions.suggestedGenre}`}
          subtitle="Popular in your circles but new territory for you"
          movies={suggestions.genreAffinity}
          badgeBuilder={(m) => ({
            text: `${m._sharedByName} loved this`,
            ringLevel: m._sharedByRing,
          })}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

function SuggestionSection({ title, subtitle, movies, badgeBuilder, onSelect }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", marginBottom: "0.15rem" }}>
        {title}
      </div>
      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "0.5rem" }}>
        {subtitle}
      </div>
      {movies.map((movie) => (
        <MovieResultCard
          key={movie.id || movie.tmdbId}
          movie={movie}
          socialBadge={badgeBuilder(movie)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default SuggestedPanel;
