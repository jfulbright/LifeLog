import React from "react";
import { Button } from "react-bootstrap";
import { RING_META } from "../../../helpers/ringMeta";

/**
 * Unified result card used across all search/discovery modes.
 * Displays movie info + optional social badge + action buttons.
 */
function MovieResultCard({ movie, socialBadge, onSelect, actions }) {
  return (
    <div className="search-result-card">
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
          {socialBadge && (
            <SocialBadge badge={socialBadge} />
          )}
        </div>
        <div className="d-flex flex-column gap-1 ms-2 flex-shrink-0">
          {actions ? actions : (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => onSelect(movie, "watched")}
              >
                Watched
              </Button>
              <Button
                size="sm"
                variant="outline-warning"
                className="text-dark"
                onClick={() => onSelect(movie, "watchlist")}
              >
                Watchlist
              </Button>
            </>
          )}
        </div>
      </div>
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
