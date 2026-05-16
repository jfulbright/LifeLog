import React from "react";

function MovieSocialFeed({ movies }) {
  const recommended = movies.filter((m) => m._isRecommended && m.status !== "watched");

  if (recommended.length === 0) return null;

  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{
        fontSize: "var(--font-size-xs)",
        fontWeight: 700,
        color: "var(--color-text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        marginBottom: "0.4rem",
      }}>
        Recommended for you
      </div>
      <div style={{
        display: "flex",
        gap: "0.6rem",
        overflowX: "auto",
        paddingBottom: "0.4rem",
      }}>
        {recommended.slice(0, 6).map((movie) => (
          <div
            key={movie.id}
            style={{
              minWidth: 120,
              maxWidth: 120,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--card-radius, 8px)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                style={{ width: "100%", height: 150, objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: 150, background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                🎬
              </div>
            )}
            <div style={{ padding: "0.4rem", fontSize: "var(--font-size-xs)" }}>
              <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {movie.title}
              </div>
              {movie._recommendedBy && (
                <div style={{ color: "var(--color-text-tertiary)", fontSize: "0.65rem", marginTop: "0.15rem" }}>
                  from {movie._recommendedBy}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MovieSocialFeed;
