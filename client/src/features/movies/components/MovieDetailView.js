import React, { useState, useEffect, useMemo } from "react";
import { Button } from "react-bootstrap";
import {
  getMovieDetails,
  getExternalIds,
  getVideos,
  getSimilarMovies,
  getMovieCredits,
  getPersonCredits,
} from "../api/movieApi";
import { getOmdbRatings } from "../api/omdbApi";
import { useAppData } from "../../../contexts/AppDataContext";
import SocialMemoriesCard from "../../../components/shared/SocialMemoriesCard";
import StarRating from "../../../components/shared/StarRating";

/**
 * Full movie detail body rendered inside EntryDetailPanel via its
 * `renderCustomView` escape hatch. Owns the entire movie-specific layout
 * (poster, status actions, synopsis, cast, ratings, social, carousels) so the
 * generic EntryView field-list is bypassed for movies.
 *
 * Works for two kinds of `item`:
 *  - a real library entry (has `item.id`) — shows status toggle + Edit/Delete
 *  - a thin TMDB preview (no `item.id`, carousel- or search-sourced) — shows
 *    "Add to Watched/Watchlist" and no Edit/Delete.
 */
function MovieDetailView({
  item,
  onEdit,
  onDelete,
  onStatusChange,
  onQuickAdd,
  onOpenMovie,
  onBack,
  onRatingsLoaded,
  onRate,
}) {
  const [details, setDetails] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [trailers, setTrailers] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [directorMovies, setDirectorMovies] = useState([]);
  const [directorName, setDirectorName] = useState("");
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(false);
  const { contacts } = useAppData();

  const tmdbId = item?.tmdbId;
  const isLibrary = Boolean(item?.id);

  // Merge fetched TMDB details over the (possibly thin) preview item so previews
  // sourced from a carousel still show synopsis/genre/year.
  const overview = item?.overview || details?.overview || "";
  const genre = item?.genre || details?.genre || "";
  const year = item?.year || details?.year || "";
  const posterUrl = item?.posterUrl || details?.posterUrl || "";
  const runtime = item?.runtime || details?.runtime || "";

  // Build social contributions from recommendedBy + shared circle data.
  const socialContributions = useMemo(() => {
    const contributions = [];
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
      const [det, vids, extIds, sim, credits] = await Promise.all([
        item?.overview && item?.genre ? Promise.resolve(null) : getMovieDetails(tmdbId).catch(() => null),
        getVideos(tmdbId).catch(() => []),
        getExternalIds(tmdbId).catch(() => null),
        getSimilarMovies(tmdbId).catch(() => []),
        getMovieCredits(tmdbId).catch(() => ({ director: null, cast: [] })),
      ]);

      if (cancelled) return;
      setDetails(det);
      setTrailers(vids);
      setSimilar(sim);
      setCast(credits?.cast || []);

      if (extIds?.imdbId) {
        const omdb = await getOmdbRatings(extIds.imdbId).catch(() => null);
        if (!cancelled && omdb) {
          setRatings(omdb);
          if (onRatingsLoaded) {
            onRatingsLoaded(tmdbId, {
              imdbRating: omdb.imdbRating ? parseFloat(omdb.imdbRating) : null,
              rtRating: omdb.rottenTomatoes ? parseInt(omdb.rottenTomatoes, 10) : null,
            });
          }
        }
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
  }, [tmdbId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;

  const isWatched = isLibrary && item.status === "watched";
  const isWatchlist = isLibrary && item.status === "watchlist";

  const handleWatched = () => {
    if (isLibrary) onStatusChange?.(item, "watched");
    else onQuickAdd?.(item, "watched");
  };
  const handleWatchlist = () => {
    if (isLibrary) onStatusChange?.(item, "watchlist");
    else onQuickAdd?.(item, "watchlist");
  };

  return (
    <div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{ background: "none", border: "none", padding: "0 0 0.5rem 0", cursor: "pointer", fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--color-primary)" }}
        >
          ← Back
        </button>
      )}

      {/* 1 + 2. Header: poster (once) + title/year/genre, status buttons floated right */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={item.title}
            style={{ width: 100, height: 150, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div style={{ width: 100, height: 150, borderRadius: 8, flexShrink: 0, background: "var(--color-movies, #E91E63)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
            🎬
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
            {item.title}
          </h3>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            {year}
            {year && genre && " · "}
            {genre}
          </div>
          {/* 6. IMDb / Rotten Tomatoes / Metascore — above the overview */}
          {ratings && (ratings.imdbRating || ratings.rottenTomatoes || ratings.metascore) && (
            <div style={{ display: "flex", gap: "0.85rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
              {ratings.imdbRating && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                  <span style={{ color: "#f5c518" }}>★</span> IMDb {ratings.imdbRating}
                </span>
              )}
              {ratings.rottenTomatoes && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                  🍅 {ratings.rottenTomatoes}
                </span>
              )}
              {ratings.metascore && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "var(--font-size-sm)", fontWeight: 600 }}>
                  Ⓜ️ {ratings.metascore}
                </span>
              )}
            </div>
          )}
          {/* 3. Synopsis — floats to the right of the poster, below genre */}
          {overview && (
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: "0.5rem 0 0 0", lineHeight: 1.5 }}>
              {overview}
            </p>
          )}
        </div>
        <div className="d-flex flex-column gap-1 flex-shrink-0">
          <Button
            size="sm"
            variant={isWatched ? "success" : "outline-success"}
            onClick={handleWatched}
          >
            {isWatched ? "✓ Watched" : isLibrary ? "Mark Watched" : "Add to Watched"}
          </Button>
          <Button
            size="sm"
            variant={isWatchlist ? "warning" : "outline-primary"}
            className={isWatchlist ? "text-dark" : ""}
            onClick={handleWatchlist}
          >
            {isWatchlist ? "✓ Watchlist" : isLibrary ? "Move to Watchlist" : "Add to Watchlist"}
          </Button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: "0.5rem 0", color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
          Loading movie details...
        </div>
      )}

      {/* Your rating — editable for library entries (prompt to rate after watching) */}
      {isLibrary && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            Your rating
          </span>
          <StarRating rating={item.rating} interactive size="1.4rem" onChange={(r) => onRate?.(item, r)} />
        </div>
      )}

      {/* 4 + 5. Director + Cast + Runtime */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "var(--font-size-sm)", marginBottom: "0.75rem" }}>
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
        {runtime && (
          <div>
            <span style={{ color: "var(--color-text-tertiary)", fontWeight: 500 }}>Runtime</span>{" "}
            <span style={{ color: "var(--color-text-primary)" }}>{runtime}</span>
          </div>
        )}
      </div>

      {/* 7. Watch trailer */}
      {trailers.length > 0 && (
        <div style={{ marginBottom: "0.75rem" }}>
          <a
            href={trailers[0].url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.9rem", borderRadius: 20, background: "var(--color-surface)", border: "1.5px solid var(--color-border)", color: "var(--color-text-primary)", fontWeight: 600, fontSize: "var(--font-size-sm)", textDecoration: "none" }}
          >
            ▶️ Watch Trailer
          </a>
        </div>
      )}

      {/* 8. Friends' ratings / snaps / collaborations */}
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

      {/* (9. "Where to Watch" intentionally removed) */}

      {/* 10. You might also like → preview modal */}
      {similar.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
            You might also like
          </div>
          <MovieCarousel movies={similar} onOpenMovie={onOpenMovie} />
        </div>
      )}

      {/* 11. More from director → preview modal */}
      {directorMovies.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
            More from {directorName}
          </div>
          <MovieCarousel movies={directorMovies} onOpenMovie={onOpenMovie} />
        </div>
      )}

      {/* 12. Edit / Delete — only for real library entries */}
      {isLibrary && (onEdit || onDelete) && (
        <div className="d-flex gap-2" style={{ marginTop: "1.25rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border)" }}>
          {onEdit && (
            <Button size="sm" variant="outline-primary" onClick={onEdit}>Edit</Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline-danger" onClick={onDelete}>Delete</Button>
          )}
        </div>
      )}
    </div>
  );
}

function MovieCarousel({ movies, onOpenMovie }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
      {movies.map((movie) => (
        <div
          key={movie.tmdbId}
          onClick={onOpenMovie ? () => onOpenMovie(movie) : undefined}
          style={{ minWidth: 90, maxWidth: 90, flexShrink: 0, textAlign: "center", cursor: onOpenMovie ? "pointer" : "default" }}
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

export default MovieDetailView;
