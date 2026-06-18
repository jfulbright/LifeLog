import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { RING_META } from "../../../helpers/ringMeta";
import SocialMemoriesCard from "../../../components/shared/SocialMemoriesCard";
import StarRating from "../../../components/shared/StarRating";

/**
 * Unified result card used across all search/discovery modes.
 * Displays movie info + optional social badge + action buttons.
 */
function MovieResultCard({ movie, socialBadge, socialBadges, socialContributions, ratings, myRating, onSelect, onClick, actions, existingStatus }) {
  const [posterFailed, setPosterFailed] = useState(false);
  const hasSocial = Array.isArray(socialContributions) && socialContributions.length > 0;
  const hasRatings = ratings && (ratings.imdbRating != null || ratings.rtRating != null);
  const hasMyRating = parseInt(myRating, 10) > 0;

  return (
    <div className="search-result-card">
      <div className="d-flex gap-3 align-items-start">
        <div
          className="d-flex gap-3 align-items-start flex-grow-1"
          onClick={onClick ? () => onClick(movie) : undefined}
          style={onClick ? { cursor: "pointer" } : undefined}
        >
          {movie.posterUrl && !posterFailed ? (
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
              onError={() => setPosterFailed(true)}
            />
          ) : (
            <div style={{ width: 50, height: 75, borderRadius: 4, flexShrink: 0, background: "var(--color-movies, #E91E63)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
              🎬
            </div>
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
            {hasMyRating && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.25rem", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                <span>Your rating</span>
                <StarRating rating={myRating} />
              </div>
            )}
            {hasRatings && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.25rem", fontSize: "var(--font-size-xs)", fontWeight: 600 }}>
                {ratings.imdbRating != null && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ color: "#f5c518" }}>★</span> IMDb {ratings.imdbRating}
                  </span>
                )}
                {ratings.rtRating != null && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                    🍅 {ratings.rtRating}%
                  </span>
                )}
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
            {socialBadges && socialBadges.length > 0 && (
              <div style={{ marginTop: "0.35rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                {socialBadges.map((badge, i) => (
                  <SocialBadge key={i} badge={badge} />
                ))}
              </div>
            )}
            {!socialBadges && socialBadge && (
              <SocialBadge badge={socialBadge} />
            )}
          </div>
        </div>
        <div className="d-flex flex-column gap-1 ms-2 flex-shrink-0">
          {actions ? actions : (
            <>
              <Button
                size="sm"
                variant={existingStatus === "watched" ? "success" : "outline-success"}
                onClick={() => onSelect(movie, "watched")}
                disabled={existingStatus === "watched"}
              >
                {existingStatus === "watched" ? "✓ Watched" : "Watched"}
              </Button>
              <Button
                size="sm"
                variant={existingStatus === "watchlist" ? "warning" : "outline-primary"}
                className={existingStatus === "watchlist" ? "text-dark" : ""}
                onClick={() => onSelect(movie, "watchlist")}
                disabled={existingStatus === "watchlist"}
              >
                {existingStatus === "watchlist" ? "✓ Watchlist" : "Watchlist"}
              </Button>
            </>
          )}
        </div>
      </div>
      {hasSocial && (
        <SocialMemoriesCard
          item={movie}
          contributions={socialContributions}
          title="From My Circle"
          subtitle={`${socialContributions.length} ${socialContributions.length === 1 ? "person" : "people"} rated this`}
        />
      )}
    </div>
  );
}

function SocialBadge({ badge }) {
  if (!badge) return null;

  const ringColor = badge.ringLevel ? RING_META[badge.ringLevel]?.color : "var(--color-text-tertiary)";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.3rem",
      marginTop: "0.35rem",
      fontSize: "var(--font-size-xs)",
      fontWeight: 600,
      color: ringColor,
    }}>
      {badge.avatar && (
        <img
          src={badge.avatar}
          alt=""
          style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }}
        />
      )}
      {badge.ringLevel && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: ringColor,
          display: "inline-block",
        }} />
      )}
      <span>{badge.text}</span>
    </div>
  );
}

export default MovieResultCard;
