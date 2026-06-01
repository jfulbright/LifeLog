import React, { useState, useEffect, useMemo } from "react";
import { getWatchProviders, getExternalIds, getVideos, getSimilarMovies, getMovieCredits, getPersonCredits } from "../api/movieApi";
import { getOmdbRatings } from "../api/omdbApi";
import { useAppData } from "../../../contexts/AppDataContext";
import SocialMemoriesCard from "../../../components/shared/SocialMemoriesCard";

function MovieDetailExtras({ item }) {
  const [providers, setProviders] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [directorMovies, setDirectorMovies] = useState([]);
  const [directorName, setDirectorName] = useState("");
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(false);
  const { contacts } = useAppData();

  const tmdbId = item?.tmdbId;

  // Build social contributions from recommendedBy + shared circle data
  const socialContributions = useMemo(() => {
    const contributions = [];
    // Recommender contributions
    const recommendedBy = item?.recommendedBy;
    if (recommendedBy) {
      const recs = Array.isArray(recommendedBy) ? recommendedBy : [recommendedBy];
      recs.forEach((r) => {
        if (r.rating || r.snaps?.length > 0) {
          const contact = contacts?.find((c) => c.linkedUserId === r.userId);
          contributions.push({
            entryId: r.entryId || null,
            userId: r.userId,
            displayName: r.displayName || contact?.displayName || "Someone",
            isOwner: false,
            isMine: false,
            snaps: r.snaps || [],
            whyNotes: r.whyNotes || "",
            photos: r.photos || [],
            rating: r.rating || null,
            avatarUrl: contact?.avatarUrl || null,
          });
        }
      });
    }
    // Social circle contributions (friends who also watched this movie)
    const socialContribs = item?._socialContributions;
    if (socialContribs) {
      socialContribs.filter((c) => !c.isOwner && !c.isMine).forEach((c) => {
        if (!contributions.find((x) => x.userId === c.userId)) {
          contributions.push(c);
        }
      });
    }
    return contributions;
  }, [item?.recommendedBy, item?._socialContributions, contacts]);

  useEffect(() => {
    if (!tmdbId) return;
    let cancelled = false;
    setLoading(true);

    async function load() {
      const [prov, vids, extIds, sim, credits] = await Promise.all([
        getWatchProviders(tmdbId).catch(() => null),
        getVideos(tmdbId).catch(() => []),
        getExternalIds(tmdbId).catch(() => null),
        getSimilarMovies(tmdbId).catch(() => []),
        getMovieCredits(tmdbId).catch(() => ({ director: null, cast: [] })),
      ]);

      if (cancelled) return;
      setProviders(prov);
      setTrailers(vids);
      setSimilar(sim);
      setCast(credits?.cast || []);

      if (extIds?.imdbId) {
        const omdb = await getOmdbRatings(extIds.imdbId).catch(() => null);
        if (!cancelled) setRatings(omdb);
      }

      if (credits?.director) {
        setDirectorName(credits.director.name);
        const dirFilms = await getPersonCredits(credits.director.id).catch(() => []);
        if (!cancelled) {
          setDirectorMovies(dirFilms.filter((m) => m.tmdbId !== tmdbId));
        }
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [tmdbId]);

  if (!tmdbId) return null;
  if (loading) {
    return (
      <div style={{ padding: "0.75rem 0", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
        Loading movie details...
      </div>
    );
  }

  const hasContent = providers || ratings || trailers.length > 0 || similar.length > 0 || directorMovies.length > 0 || cast.length > 0 || socialContributions.length > 0;
  if (!hasContent && !item.overview) return null;

  return (
    <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>

      {/* Movie Info: poster + overview + metadata */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {item.posterUrl && (
          <img
            src={item.posterUrl}
            alt={item.title}
            style={{ width: 100, height: 150, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {item.overview && (
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: "0 0 0.5rem 0", lineHeight: 1.5 }}>
              {item.overview}
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "var(--font-size-sm)" }}>
            {(directorName || item.director) && (
              <div>
                <span style={{ color: "var(--color-text-tertiary)", fontWeight: 500 }}>Director</span>{" "}
                <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{directorName || item.director}</span>
              </div>
            )}
            {cast.length > 0 && (
              <div>
                <span style={{ color: "var(--color-text-tertiary)", fontWeight: 500 }}>Cast</span>{" "}
                <span style={{ color: "var(--color-text-primary)" }}>{cast.map((c) => c.name).join(", ")}</span>
              </div>
            )}
            {item.runtime && (
              <div>
                <span style={{ color: "var(--color-text-tertiary)", fontWeight: 500 }}>Runtime</span>{" "}
                <span style={{ color: "var(--color-text-primary)" }}>{item.runtime}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social: recommenders + circle ratings */}
      {socialContributions.length > 0 && (
        <SocialMemoriesCard
          item={item}
          contacts={contacts}
          contributions={socialContributions}
          expanded
          title="From My Circle"
          subtitle={`${socialContributions.length} ${socialContributions.length === 1 ? "person" : "people"} rated this`}
        />
      )}

      {/* Ratings row */}
      {ratings && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {ratings.imdbRating && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
              <span style={{ color: "#f5c518" }}>★</span> IMDb {ratings.imdbRating}
            </span>
          )}
          {ratings.rottenTomatoes && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
              🍅 {ratings.rottenTomatoes}
            </span>
          )}
          {ratings.metascore && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
              Ⓜ️ {ratings.metascore}
            </span>
          )}
        </div>
      )}

      {trailers.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <a
            href={trailers[0].url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.9rem",
              borderRadius: 20,
              background: "var(--color-surface)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-primary)",
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
          >
            ▶️ Watch Trailer
          </a>
        </div>
      )}

      {providers && (
        <div style={{ marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginBottom: "0.4rem", fontWeight: 600 }}>
            Where to Watch
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {providers.flatrate.length > 0 && (
              <ProviderRow label="Stream" items={providers.flatrate} />
            )}
            {providers.rent.length > 0 && (
              <ProviderRow label="Rent" items={providers.rent} />
            )}
            {providers.buy.length > 0 && (
              <ProviderRow label="Buy" items={providers.buy} />
            )}
          </div>
          {providers.link && (
            <a
              href={providers.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.3rem", display: "inline-block" }}
            >
              View all options →
            </a>
          )}
        </div>
      )}

      {similar.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
            You might also like
          </div>
          <MovieCarousel movies={similar} />
        </div>
      )}

      {directorMovies.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
            More from {directorName}
          </div>
          <MovieCarousel movies={directorMovies} />
        </div>
      )}
    </div>
  );
}

function MovieCarousel({ movies }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
      {movies.map((movie) => (
        <div
          key={movie.tmdbId}
          style={{
            minWidth: 90,
            maxWidth: 90,
            flexShrink: 0,
            textAlign: "center",
          }}
        >
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }}
            />
          ) : (
            <div style={{ width: "100%", height: 120, background: "var(--color-bg)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
              🎬
            </div>
          )}
          <div style={{ fontSize: "0.65rem", fontWeight: 600, marginTop: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {movie.title}
          </div>
          {movie.year && (
            <div style={{ fontSize: "0.6rem", color: "var(--color-text-tertiary)" }}>{movie.year}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProviderRow({ label, items }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginRight: "0.2rem" }}>
        {label}:
      </span>
      {items.slice(0, 4).map((p, i) => (
        <img
          key={i}
          src={p.logo}
          alt={p.name}
          title={p.name}
          style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover" }}
        />
      ))}
      {items.length > 4 && (
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
          +{items.length - 4}
        </span>
      )}
    </div>
  );
}

export default MovieDetailExtras;
