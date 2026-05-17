import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button, Spinner } from "react-bootstrap";
import movieSchema from "../movieSchema";
import MovieForm from "./MovieForm";
import MovieDetailExtras from "./MovieDetailExtras";
import MovieSocialFeed from "./MovieSocialFeed";
import MovieResultCard from "./MovieResultCard";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_GROUP } from "../../../components/shared/GroupedDropdownFilter";
import useCategory from "../../../hooks/useCategory";
import { useAppData } from "../../../contexts/AppDataContext";
import { searchMovies } from "../api/movieApi";
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

const GENRE_EMOJIS = {
  Action: "\u{1F3AC}", Comedy: "\u{1F602}", Drama: "\u{1F3AD}", Horror: "\u{1F631}",
  "Science Fiction": "\u{1F52E}", "Sci-Fi": "\u{1F52E}", Romance: "\u{1F495}",
  Documentary: "\u{1F4D6}", Thriller: "\u{1F52A}", Animation: "\u{1F9F8}",
  Fantasy: "\u{1F409}", Adventure: "\u{1F5FA}\uFE0F", Crime: "\u{1F50D}", Family: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
  Mystery: "\u{1F50E}", War: "\u2694\uFE0F", Music: "\u{1F3B5}", Western: "\u{1F920}",
};

const DECADE_ORDER = ["2020s", "2010s", "2000s", "90s", "80s", "Classic"];

function getDecade(year) {
  const y = parseInt(year, 10);
  if (!y || isNaN(y)) return null;
  if (y >= 2020) return "2020s";
  if (y >= 2010) return "2010s";
  if (y >= 2000) return "2000s";
  if (y >= 1990) return "90s";
  if (y >= 1980) return "80s";
  return "Classic";
}

function matchesRating(rating, filter) {
  const r = parseInt(rating, 10);
  if (filter === "unrated") return !r;
  if (filter === "5") return r === 5;
  if (filter === "4+") return r >= 4;
  if (filter === "3+") return r >= 3;
  return true;
}

function MovieList() {
  const {
    items: movies,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("movies", { normalize: (data) => ({ ...data, status: data.status || "watchlist", startDate: data.startDate || "" }), schema: movieSchema });

  const [movieFilter, setMovieFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const { profile } = useAppData();

  // Inline TMDB search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchActive(true);
    try {
      const results = await searchMovies(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error("TMDB search failed:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchActive(false);
  }, []);

  // Quick-add: save directly without opening FormPanel
  const pendingQuickAdd = useRef(false);

  const handleQuickAdd = useCallback((movie, status) => {
    const { _socialSource, _sharedByName, _sharedByRing, _sharedByContactId, _sharedByUserId,
      _socialRating, _recId, _recommendedBy, _recommenderAvatar, _recommenderRing,
      _recommendedAt, _consensusCount, _tasteScore, _suggestedGenre, ...clean } = movie;
    const data = {
      ...clean,
      status: status || "watchlist",
      startDate: status === "watched" ? new Date().toISOString().slice(0, 10) : "",
    };
    pendingQuickAdd.current = true;
    setFormData(data);
  }, [setFormData]);

  useEffect(() => {
    if (pendingQuickAdd.current && formData?.title) {
      pendingQuickAdd.current = false;
      handleSubmit();
    }
  }, [formData, handleSubmit]);

  // Build a lookup of user's movies by tmdbId for status badges on search results
  const moviesByTmdbId = useMemo(() => {
    const map = {};
    movies.forEach((m) => {
      if (m.tmdbId) map[m.tmdbId] = m;
    });
    return map;
  }, [movies]);

  // Social enrichment lookup for search results
  const socialByTmdbId = useMemo(() => {
    const shared = movies.filter((m) => m._isShared && m.tmdbId);
    const map = {};
    shared.forEach((m) => {
      if (!map[m.tmdbId] || (m._socialRating || 0) > (map[m.tmdbId]._socialRating || 0)) {
        map[m.tmdbId] = m;
      }
    });
    return map;
  }, [movies]);

  const movieStatuses = getStatusFilterOptions("movies");

  const availableGenres = useMemo(() => {
    const genreSet = new Set();
    movies.forEach((m) => {
      if (m.genre) {
        m.genre.split(",").forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) genreSet.add(trimmed);
        });
      }
    });
    return [...genreSet].sort();
  }, [movies]);

  const availableDecades = useMemo(() => {
    const present = new Set();
    movies.forEach((m) => {
      const d = getDecade(m.year);
      if (d) present.add(d);
    });
    return DECADE_ORDER.filter((d) => present.has(d));
  }, [movies]);

  const movieFilterGroups = useMemo(() => {
    const groups = [];
    if (availableGenres.length > 0) {
      groups.push({
        key: "genre",
        label: "\u{1F3AC} Genre",
        options: availableGenres.map((g) => ({ value: `genre:${g}`, label: `${GENRE_EMOJIS[g] || "\u{1F3DE}\uFE0F"} ${g}` })),
      });
    }
    if (availableDecades.length > 0) {
      groups.push({
        key: "decade",
        label: "\u{1F4C5} Decade",
        options: availableDecades.map((d) => ({ value: `decade:${d}`, label: d })),
      });
    }
    groups.push(RATING_GROUP);
    groups.push({
      key: "ring",
      label: "\u{1F48E} From Rings",
      options: [
        { value: "ring:partner", label: "\u{1F48E} Partner loved" },
        { value: "ring:family", label: "\u{1F3E0} Family loved" },
        { value: "ring:friends", label: "\u{1F465} Friends loved" },
        { value: "ring:unwatched", label: "\u{1F3AF} Not yet watched (rec'd)" },
      ],
    });
    return groups;
  }, [availableGenres, availableDecades]);

  const statusFiltered = filterByStatus(movies, filterStatus);
  const sourceFiltered = sourceFilter === "mine"
    ? statusFiltered.filter((i) => !i._isShared)
    : sourceFilter === "shared"
    ? statusFiltered.filter((i) => i._isShared)
    : sourceFilter === "recommended"
    ? statusFiltered.filter((i) => i._isRecommended)
    : statusFiltered;

  const filteredMovies = useMemo(() => {
    if (movieFilter === "all") return sourceFiltered;
    const [type, val] = movieFilter.split(":");
    if (type === "genre") {
      return sourceFiltered.filter((m) =>
        (m.genre || "").split(",").map((g) => g.trim()).includes(val)
      );
    }
    if (type === "decade") {
      return sourceFiltered.filter((m) => getDecade(m.year) === val);
    }
    if (type === "rating") {
      return sourceFiltered.filter((m) => matchesRating(m.rating, val));
    }
    if (type === "ring") {
      if (val === "partner") {
        return sourceFiltered.filter((m) => m._isShared && m._sharedByRing === 1 && parseInt(m.rating, 10) >= 4);
      }
      if (val === "family") {
        return sourceFiltered.filter((m) => m._isShared && (m._sharedByRing === 2 || m._sharedByRing === 3) && parseInt(m.rating, 10) >= 4);
      }
      if (val === "friends") {
        return sourceFiltered.filter((m) => m._isShared && m._sharedByRing === 4 && parseInt(m.rating, 10) >= 4);
      }
      if (val === "unwatched") {
        return sourceFiltered.filter((m) => m._isRecommended && m.status !== "watched");
      }
    }
    return sourceFiltered;
  }, [sourceFiltered, movieFilter]);

  const sectionTitle = `Movies - ${getStatusLabel("movies", filterStatus)}`;
  const watchedCount = movies.filter((m) => m.status === "watched").length;
  const watchlistCount = movies.filter((m) => m.status === "watchlist").length;

  return (
    <>
      <CategoryListHeader
        title={"\u{1F3AC} Movies"}
        addLabel="+ Add Movie"
        onAdd={openForm}
        stats={movies.length > 0 ? [
          { value: watchedCount, label: "watched", color: "var(--color-movies, #E91E63)" },
          { value: watchlistCount, label: "on watchlist", color: "var(--color-text-secondary)" },
        ] : null}
        category="movies"
        statusOptions={movieStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        renderExtraFilters={() => <MovieSocialFeed movies={movies} />}
        filterGroups={movieFilterGroups}
        filterValue={movieFilter}
        onFilterChange={setMovieFilter}
        filterColor="var(--color-movies, #E91E63)"
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={movies.filter((i) => i._isShared).length}
        recommendedCount={movies.filter((i) => i._isRecommended).length}
      />

      {/* Inline TMDB Search Bar */}
      <div style={{ marginBottom: "1rem" }}>
        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search TMDB to add a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ borderRadius: 20, paddingLeft: "1rem" }}
          />
          {searchActive ? (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={clearSearch}
              style={{ borderRadius: 20, whiteSpace: "nowrap" }}
            >
              Clear
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
              style={{ borderRadius: 20, whiteSpace: "nowrap" }}
            >
              {searchLoading ? <Spinner animation="border" size="sm" /> : "Search"}
            </Button>
          )}
        </div>
      </div>

      {/* Search Results (replaces library when active) */}
      {searchActive ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin: 0,
            }}>
              {searchLoading ? "Searching..." : `${searchResults.length} results`}
            </h6>
          </div>
          {searchResults.map((movie) => {
            const existing = moviesByTmdbId[movie.tmdbId];
            const socialMatch = socialByTmdbId[movie.tmdbId];
            const badge = socialMatch
              ? {
                  text: `${socialMatch._sharedByName || "Someone in your circles"} rated ${"★".repeat(parseInt(socialMatch.rating, 10) || 0)}`,
                  ringLevel: socialMatch._sharedByRing,
                }
              : null;

            const statusBadge = existing
              ? existing.status === "watched"
                ? `Watched${existing.rating ? ` - ${"★".repeat(parseInt(existing.rating, 10))}` : ""}`
                : "On your watchlist"
              : null;

            return (
              <MovieResultCard
                key={movie.tmdbId}
                movie={movie}
                socialBadge={badge}
                onSelect={handleQuickAdd}
                actions={existing ? (
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => setViewDetailItem(existing)}
                  >
                    {statusBadge}
                  </Button>
                ) : undefined}
              />
            );
          })}
          {!searchLoading && searchResults.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--color-text-tertiary)", padding: "2rem 0" }}>
              No results found. Try a different title.
            </div>
          )}
        </div>
      ) : (
        <>
          {filteredMovies.length === 0 && !showForm && !loading && (
            <div className="empty-state">
              <div
                className="empty-state-icon"
                style={{ backgroundColor: "var(--color-movies, #E91E63)", color: "#fff" }}
              >
                {"\u{1F3AC}"}
              </div>
              <div className="empty-state-title">
                {movies.length === 0 ? "No movies yet" : "No matches"}
              </div>
              <div className="empty-state-text">
                {movies.length === 0
                  ? "Search TMDB above or add one manually to start tracking your movie life."
                  : "No movies match this filter."}
              </div>
              {movies.length === 0 && (
                <Button variant="primary" onClick={openForm}>
                  Add Your First Movie
                </Button>
              )}
            </div>
          )}

          <ItemCardList
            category="movies"
            title={sectionTitle}
            items={filteredMovies}
            schema={movieSchema}
            onEdit={startEditing}
            onDelete={deleteItem}
            onViewDetail={setViewDetailItem}
            renderCompactExtra={(item) => {
              const social = item.tmdbId && socialByTmdbId[item.tmdbId];
              if (!social || social.id === item.id) return null;
              const stars = parseInt(social._socialRating || social.rating, 10);
              return (
                <div style={{
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 600,
                  color: "var(--color-text-tertiary)",
                  marginTop: "0.2rem",
                }}>
                  {social._sharedByName || "Someone in your circles"} rated {"★".repeat(stars || 0)}
                </div>
              );
            }}
          />
        </>
      )}

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Movie" : "Add Movie"}
      >
        <MovieForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Movie saved \u{1F3AC}"
      />

      <SnapCaptureModal
        show={showSnapPrompt}
        onClose={dismissSnapPrompt}
        onSave={handleSnapSave}
        itemTitle={snapPromptTitle}
      />

      {viewDetailItem && (
        <EntryDetailPanel
          item={viewDetailItem}
          category="movies"
          schema={movieSchema}
          onClose={() => setViewDetailItem(null)}
          onSave={() => setViewDetailItem(null)}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
          renderItemExtras={(item) => <MovieDetailExtras item={item} />}
        />
      )}
    </>
  );
}

export default MovieList;
