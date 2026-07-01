import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button, Spinner } from "react-bootstrap";
import movieSchema from "../movieSchema";
import MovieForm from "./MovieForm";
import MovieDetailView from "./MovieDetailView";
import MovieSocialFeed from "./MovieSocialFeed";
import MovieResultCard from "./MovieResultCard";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import SocialMemoriesCard from "../../../components/shared/SocialMemoriesCard";
import useCategory from "../../../hooks/useCategory";
import useListFilters from "../../../hooks/useListFilters";
import { useAppData } from "../../../contexts/AppDataContext";
import { useViewerMode } from "../../../contexts/ViewerModeContext";
import { searchMovies, getExternalIds } from "../api/movieApi";
import { getOmdbRatings } from "../api/omdbApi";
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

const GENRE_EMOJIS = {
  Action: "\u{1F3AC}", Comedy: "\u{1F602}", Drama: "\u{1F3AD}", Horror: "\u{1F631}",
  "Science Fiction": "\u{1F52E}", "Sci-Fi": "\u{1F52E}", Romance: "\u{1F495}",
  Documentary: "\u{1F4D6}", Thriller: "\u{1F52A}", Animation: "\u{1F9F8}",
  Fantasy: "\u{1F409}", Adventure: "\u{1F5FA}️", Crime: "\u{1F50D}", Family: "\u{1F468}‍\u{1F469}‍\u{1F467}",
  Mystery: "\u{1F50E}", War: "⚔️", Music: "\u{1F3B5}", Western: "\u{1F920}",
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

const TODAY = () => new Date().toISOString().slice(0, 10);

// Concurrency limit for the background OMDB rating backfill.
const RATING_BACKFILL_CONCURRENCY = 4;

// Fetch IMDb/RT ratings for a list of tmdbIds with a small concurrency limit.
// `attempted` is a Set used to avoid re-fetching the same id. Failures are
// swallowed (the movie is simply absent from the result map / rating filters).
async function fetchOmdbBatch(tmdbIds, attempted) {
  const fetched = {};
  for (let i = 0; i < tmdbIds.length; i += RATING_BACKFILL_CONCURRENCY) {
    const batch = tmdbIds.slice(i, i + RATING_BACKFILL_CONCURRENCY);
    await Promise.all(batch.map(async (tid) => {
      attempted.add(tid);
      try {
        const ext = await getExternalIds(tid);
        if (!ext?.imdbId) return;
        const omdb = await getOmdbRatings(ext.imdbId);
        if (!omdb) return;
        const imdbRating = omdb.imdbRating ? parseFloat(omdb.imdbRating) : null;
        const rtRating = omdb.rottenTomatoes ? parseInt(omdb.rottenTomatoes, 10) : null;
        if (imdbRating != null || rtRating != null) fetched[tid] = { imdbRating, rtRating };
      } catch { /* leave uncached */ }
    }));
  }
  return fetched;
}

// Build a normalized social contribution from a friend's shared movie entry.
function contributionFromShared(m) {
  return {
    userId: m._sharedByUserId,
    displayName: m._sharedByName || "Someone",
    isOwner: false,
    isMine: false,
    rating: parseInt(m.rating || m._socialRating, 10) || null,
    snaps: [m.snapshot1, m.snapshot2, m.snapshot3].filter(Boolean),
    photos: [m.photo1, m.photo2, m.photo3].filter(Boolean),
    whyNotes: "",
    avatarUrl: m._recommenderAvatar || null,
    ringLevel: m._sharedByRing,
  };
}

function MovieList() {
  const isViewer = !!useViewerMode();
  const {
    items: movies,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm, saveDetailEdit, applyPatchMap,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("movies", { normalize: (data) => ({ ...data, status: data.status || "watchlist", startDate: data.startDate || "" }), schema: movieSchema });

  // Each movie filter dimension is independent so they combine (e.g. Drama +
  // IMDb 8+ + RT 90+ at once). "all" = that dimension is unset.
  const [genreFilter, setGenreFilter] = useState("all");
  const [decadeFilter, setDecadeFilter] = useState("all");
  const [myRatingFilter, setMyRatingFilter] = useState("all");
  const [peopleRatingFilter, setPeopleRatingFilter] = useState("all");
  const [imdbFilter, setImdbFilter] = useState("all");
  const [rtFilter, setRtFilter] = useState("all");
  const [ringFilter, setRingFilter] = useState("all");
  const lf = useListFilters(movies, { dateField: "startDate" });
  const { profile } = useAppData();

  // Shared predicate so the library list and the search results filter identically.
  const matchesRingFilter = useCallback((m, val) => {
    if (val === "all") return true;
    if (!m || !m._isShared) return val === "unwatched" ? !!(m && m._isRecommended && m.status !== "watched") : false;
    const rr = parseInt(m.rating, 10);
    if (val === "partner") return m._sharedByRing === 1 && rr >= 4;
    if (val === "family") return (m._sharedByRing === 2 || m._sharedByRing === 3) && rr >= 4;
    if (val === "friends") return m._sharedByRing === 4 && rr >= 4;
    if (val === "unwatched") return m._isRecommended && m.status !== "watched";
    return true;
  }, []);

  // Inline TMDB search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  // IMDb / RT ratings cache (tmdbId -> { imdbRating, rtRating }) for filtering.
  const [ratingsByTmdbId, setRatingsByTmdbId] = useState({});
  const attemptedRatingsRef = useRef(new Set());

  // Carousel drill-down preview stack (TMDB movies not in the library yet).
  const [previewStack, setPreviewStack] = useState([]);

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
  // After a "watched" quick-add, open the new entry's detail so the user can
  // rate it. Holds the tmdbId (or title) of the entry to open once it lands.
  const openDetailAfterAddRef = useRef(null);

  const handleQuickAdd = useCallback((movie, status) => {
    const { _socialSource, _sharedByName, _sharedByRing, _sharedByContactId, _sharedByUserId,
      _socialRating, _recId, _recommendedBy, _recommenderAvatar, _recommenderRing,
      _recommendedAt, _consensusCount, _tasteScore, _suggestedGenre, _isPreview,
      _socialContributions, _isShared, ...clean } = movie;
    const data = {
      ...clean,
      status: status || "watchlist",
      startDate: status === "watched" ? TODAY() : "",
      visibilityRings: [1, 2, 3, 4, 5],
    };
    if (status === "watched") openDetailAfterAddRef.current = movie.tmdbId || movie.title;
    pendingQuickAdd.current = true;
    setFormData(data);
  }, [setFormData]);

  useEffect(() => {
    if (pendingQuickAdd.current && formData?.title) {
      pendingQuickAdd.current = false;
      handleSubmit();
    }
  }, [formData, handleSubmit]);

  // Once a "watched" quick-add has landed in the list, open its detail screen
  // so the user can add a rating. (Watchlist adds keep the existing flow.)
  useEffect(() => {
    const key = openDetailAfterAddRef.current;
    if (!key) return;
    const found = movies.find((m) =>
      !m._isShared && m.status === "watched" && (m.tmdbId === key || (!m.tmdbId && m.title === key))
    );
    if (found) {
      openDetailAfterAddRef.current = null;
      setViewDetailItem(found);
    }
  }, [movies, setViewDetailItem]);

  // Build a lookup of user's movies by tmdbId for status badges on search results
  const moviesByTmdbId = useMemo(() => {
    const map = {};
    movies.forEach((m) => {
      if (m.tmdbId) map[m.tmdbId] = m;
    });
    return map;
  }, [movies]);

  // Social enrichment lookup — all friends' contributions (rating + snaps) per tmdbId.
  const socialByTmdbId = useMemo(() => {
    const map = {};
    movies.filter((m) => m._isShared && m.tmdbId).forEach((m) => {
      if (!map[m.tmdbId]) map[m.tmdbId] = [];
      map[m.tmdbId].push(contributionFromShared(m));
    });
    return map;
  }, [movies]);

  // Average of friends' ratings per tmdbId (for the "My People Rating" filter).
  const peopleRatingByTmdbId = useMemo(() => {
    const map = {};
    Object.entries(socialByTmdbId).forEach(([tmdbId, contribs]) => {
      const rated = contribs.map((c) => c.rating).filter((r) => r > 0);
      if (rated.length > 0) map[tmdbId] = rated.reduce((a, b) => a + b, 0) / rated.length;
    });
    return map;
  }, [socialByTmdbId]);

  // Cached IMDb/RT readers: prefer persisted item value, fall back to session cache.
  const getImdb = useCallback((m) => {
    const v = m.imdbRating != null ? m.imdbRating : ratingsByTmdbId[m.tmdbId]?.imdbRating;
    return v != null ? v : null;
  }, [ratingsByTmdbId]);
  const getRt = useCallback((m) => {
    const v = m.rtRating != null ? m.rtRating : ratingsByTmdbId[m.tmdbId]?.rtRating;
    return v != null ? v : null;
  }, [ratingsByTmdbId]);

  // Record OMDB ratings fetched by an open detail modal (in-memory + persist to own entry).
  const handleRatingsLoaded = useCallback((tmdbId, vals) => {
    if (!tmdbId || (vals.imdbRating == null && vals.rtRating == null)) return;
    attemptedRatingsRef.current.add(tmdbId);
    setRatingsByTmdbId((prev) => (prev[tmdbId] ? prev : { ...prev, [tmdbId]: vals }));
    const own = movies.find((m) => m.tmdbId === tmdbId && !m._isShared && m.id);
    if (own && own.imdbRating == null && own.rtRating == null) {
      applyPatchMap({ [own.id]: vals });
    }
  }, [movies, applyPatchMap]);

  // Throttled background backfill of IMDb/RT for library movies missing ratings,
  // so the IMDb / Rotten Tomatoes filters work without opening each movie.
  useEffect(() => {
    const seen = new Set();
    const need = [];
    movies.forEach((m) => {
      if (!m.tmdbId) return;
      if (m.imdbRating != null || m.rtRating != null) return;
      if (ratingsByTmdbId[m.tmdbId] !== undefined) return;
      if (attemptedRatingsRef.current.has(m.tmdbId)) return;
      if (seen.has(m.tmdbId)) return;
      seen.add(m.tmdbId);
      need.push(m.tmdbId);
    });
    if (need.length === 0) return;

    let cancelled = false;
    (async () => {
      const fetched = await fetchOmdbBatch(need, attemptedRatingsRef.current);
      if (cancelled || Object.keys(fetched).length === 0) return;
      setRatingsByTmdbId((prev) => ({ ...prev, ...fetched }));
      const patchMap = {};
      movies.forEach((m) => {
        if (!m._isShared && m.id && fetched[m.tmdbId]) patchMap[m.id] = fetched[m.tmdbId];
      });
      applyPatchMap(patchMap);
    })();
    return () => { cancelled = true; };
  }, [movies, ratingsByTmdbId, applyPatchMap]);

  // Backfill IMDb/RT for the current TMDB search results too, so SERP cards can
  // show ratings and the IMDb / Rotten Tomatoes filters apply to search hits.
  useEffect(() => {
    if (!searchActive || searchResults.length === 0) return;
    const need = searchResults
      .map((r) => r.tmdbId)
      .filter((tid) => tid && ratingsByTmdbId[tid] === undefined && !attemptedRatingsRef.current.has(tid));
    if (need.length === 0) return;

    let cancelled = false;
    (async () => {
      const fetched = await fetchOmdbBatch(need, attemptedRatingsRef.current);
      if (cancelled || Object.keys(fetched).length === 0) return;
      setRatingsByTmdbId((prev) => ({ ...prev, ...fetched }));
    })();
    return () => { cancelled = true; };
  }, [searchActive, searchResults, ratingsByTmdbId]);

  // The same header filter pills apply to TMDB search results, interpreted
  // against each result's library / social state so the displayed SERP list
  // stays consistent with the rest of the filter bar.
  const filteredSearchResults = useMemo(() => {
    return searchResults.filter((r) => {
      const lib = moviesByTmdbId[r.tmdbId];
      const contribs = socialByTmdbId[r.tmdbId];

      // Status: narrow to results whose library entry matches the chosen status.
      if (filterStatus !== "all" && lib?.status !== filterStatus) return false;

      // Source: mine / shared / recommended, against library + social state.
      if (lf.sourceFilter === "mine" && !(lib && !lib._isShared)) return false;
      if (lf.sourceFilter === "shared" && !((lib && lib._isShared) || (contribs && contribs.length > 0))) return false;
      if (lf.sourceFilter === "recommended" && !(lib && lib._isRecommended)) return false;

      // Year: watch-year of the library entry (results not in library drop out).
      if (lf.activeYear && lf.activeYear !== "all") {
        const sd = lib?.startDate;
        const y = sd ? new Date(sd + "T00:00:00").getFullYear() : null;
        if (String(y) !== String(lf.activeYear)) return false;
      }

      // Category dropdowns (each independent; they combine).
      if (genreFilter !== "all" && !(r.genre || "").split(",").map((g) => g.trim()).includes(genreFilter)) return false;
      if (decadeFilter !== "all" && getDecade(r.year) !== decadeFilter) return false;
      if (myRatingFilter !== "all" && !matchesRating(lib?.rating, myRatingFilter)) return false;
      if (peopleRatingFilter !== "all") {
        const pr = peopleRatingByTmdbId[r.tmdbId];
        if (!(pr != null && pr >= parseFloat(peopleRatingFilter))) return false;
      }
      if (imdbFilter !== "all") {
        const v = getImdb({ tmdbId: r.tmdbId, imdbRating: lib?.imdbRating });
        if (!(v != null && v >= parseFloat(imdbFilter))) return false;
      }
      if (rtFilter !== "all") {
        const v = getRt({ tmdbId: r.tmdbId, rtRating: lib?.rtRating });
        if (!(v != null && v >= parseFloat(rtFilter))) return false;
      }
      if (ringFilter !== "all" && !matchesRingFilter(lib, ringFilter)) return false;
      return true;
    });
  }, [searchResults, filterStatus, lf.sourceFilter, lf.activeYear, genreFilter, decadeFilter, myRatingFilter, peopleRatingFilter, imdbFilter, rtFilter, ringFilter, matchesRingFilter, moviesByTmdbId, socialByTmdbId, peopleRatingByTmdbId, getImdb, getRt]);

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

  const moviePills = useMemo(() => {
    const pills = [];
    if (availableGenres.length > 0) {
      pills.push({
        key: "genre",
        label: "\u{1F3AC} Genre",
        value: genreFilter,
        onChange: setGenreFilter,
        options: availableGenres.map((g) => ({ value: g, label: `${GENRE_EMOJIS[g] || "\u{1F3DE}️"} ${g}` })),
      });
    }
    if (availableDecades.length > 0) {
      pills.push({
        key: "decade",
        label: "\u{1F4C5} Decade",
        value: decadeFilter,
        onChange: setDecadeFilter,
        options: availableDecades.map((d) => ({ value: d, label: d })),
      });
    }
    pills.push({
      key: "myrating",
      label: "★ My Rating",
      value: myRatingFilter,
      onChange: setMyRatingFilter,
      options: [
        { value: "5", label: "★★★★★" },
        { value: "4+", label: "★★★★☆+" },
        { value: "3+", label: "★★★☆☆+" },
        { value: "unrated", label: "No rating" },
      ],
    });
    pills.push({
      key: "peoplerating",
      label: "\u{1F465} People Rating",
      value: peopleRatingFilter,
      onChange: setPeopleRatingFilter,
      options: [
        { value: "4.5+", label: "★★★★★ Loved" },
        { value: "4+", label: "★★★★☆+" },
        { value: "3+", label: "★★★☆☆+" },
      ],
    });
    pills.push({
      key: "imdb",
      label: "★ IMDb",
      value: imdbFilter,
      onChange: setImdbFilter,
      options: [
        { value: "8+", label: "8+ Exceptional" },
        { value: "7+", label: "7+ Great" },
        { value: "6+", label: "6+ Good" },
      ],
    });
    pills.push({
      key: "rt",
      label: "\u{1F345} Rotten Tomatoes",
      value: rtFilter,
      onChange: setRtFilter,
      options: [
        { value: "90+", label: "90%+ Certified" },
        { value: "75+", label: "75%+ Fresh" },
        { value: "60+", label: "60%+" },
      ],
    });
    pills.push({
      key: "ring",
      label: "\u{1F48E} From Rings",
      value: ringFilter,
      onChange: setRingFilter,
      options: [
        { value: "partner", label: "\u{1F48E} Partner loved" },
        { value: "family", label: "\u{1F3E0} Family loved" },
        { value: "friends", label: "\u{1F465} Friends loved" },
        { value: "unwatched", label: "\u{1F3AF} Not yet watched (rec'd)" },
      ],
    });
    return pills;
  }, [availableGenres, availableDecades, genreFilter, decadeFilter, myRatingFilter, peopleRatingFilter, imdbFilter, rtFilter, ringFilter]);

  const statusFiltered = filterByStatus(movies, filterStatus);
  const commonFiltered = lf.applyCommonFilters(statusFiltered);

  const filteredMovies = useMemo(() => {
    return commonFiltered.filter((m) => {
      if (genreFilter !== "all" && !(m.genre || "").split(",").map((g) => g.trim()).includes(genreFilter)) return false;
      if (decadeFilter !== "all" && getDecade(m.year) !== decadeFilter) return false;
      if (myRatingFilter !== "all" && !matchesRating(m.rating, myRatingFilter)) return false;
      if (peopleRatingFilter !== "all") {
        const pr = peopleRatingByTmdbId[m.tmdbId];
        if (!(pr != null && pr >= parseFloat(peopleRatingFilter))) return false;
      }
      if (imdbFilter !== "all") { const v = getImdb(m); if (!(v != null && v >= parseFloat(imdbFilter))) return false; }
      if (rtFilter !== "all") { const v = getRt(m); if (!(v != null && v >= parseFloat(rtFilter))) return false; }
      if (ringFilter !== "all" && !matchesRingFilter(m, ringFilter)) return false;
      return true;
    });
  }, [commonFiltered, genreFilter, decadeFilter, myRatingFilter, peopleRatingFilter, imdbFilter, rtFilter, ringFilter, matchesRingFilter, peopleRatingByTmdbId, getImdb, getRt]);

  const sectionTitle = `Movies - ${getStatusLabel("movies", filterStatus)}`;
  const watchedCount = movies.filter((m) => m.status === "watched").length;
  const watchlistCount = movies.filter((m) => m.status === "watchlist").length;

  // ── Detail / preview modal wiring ──────────────────────────────────────────

  // Build an enriched, read-only preview item for a TMDB movie not in the library.
  const buildPreviewItem = useCallback((m) => {
    const preview = { ...m, _isPreview: true };
    const contribs = socialByTmdbId[m.tmdbId];
    if (contribs?.length > 0) {
      preview._isShared = true;
      preview._sharedByName = contribs[0].displayName;
      preview._sharedByRing = contribs[0].ringLevel;
      preview._socialContributions = contribs;
    }
    return preview;
  }, [socialByTmdbId]);

  // The currently displayed detail item: top of the carousel preview stack,
  // otherwise the base entry opened from the list/search.
  const activeDetail = previewStack.length > 0 ? previewStack[previewStack.length - 1] : viewDetailItem;

  const openMoviePreview = useCallback((m) => {
    setPreviewStack((stack) => [...stack, buildPreviewItem(m)]);
  }, [buildPreviewItem]);

  const closeDetail = useCallback(() => {
    setPreviewStack([]);
    setViewDetailItem(null);
  }, [setViewDetailItem]);

  const popPreview = useCallback(() => {
    setPreviewStack((stack) => stack.slice(0, -1));
  }, []);

  const handleStatusChange = useCallback((mv, status) => {
    const updated = {
      ...mv,
      status,
      startDate: status === "watched" ? (mv.startDate || TODAY()) : (mv.startDate || ""),
    };
    saveDetailEdit(updated);
    setViewDetailItem((prev) => (prev && prev.id === mv.id ? updated : prev));
  }, [saveDetailEdit, setViewDetailItem]);

  const handleRate = useCallback((mv, rating) => {
    const updated = { ...mv, rating: String(rating) };
    saveDetailEdit(updated);
    setViewDetailItem((prev) => (prev && prev.id === mv.id ? updated : prev));
  }, [saveDetailEdit, setViewDetailItem]);

  return (
    <>
      <CategoryListHeader
        title={"\u{1F3AC} Movies"}
        stats={movies.length > 0 ? [
          { value: watchedCount, label: "watched", color: "var(--color-movies, #E91E63)" },
          { value: watchlistCount, label: "on watchlist", color: "var(--color-text-secondary)" },
        ] : null}
        statsLink={{ to: "/movies/stats", color: "var(--color-movies, #E91E63)" }}
        category="movies"
        statusOptions={movieStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        yearOptions={lf.yearOptions}
        activeYear={lf.activeYear}
        onYearChange={lf.setActiveYear}
        renderExtraFilters={() => <MovieSocialFeed movies={movies} />}
        filterPills={moviePills}
        filterColor="var(--color-movies, #E91E63)"
        sourceFilter={lf.sourceFilter}
        onSourceChange={lf.setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={lf.sharedCount}
        recommendedCount={lf.recommendedCount}
      />

      {/* Inline TMDB Search Bar (hidden when viewing another user's movies) */}
      {!isViewer && (
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="d-flex gap-2 align-items-center">
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: "var(--color-text-tertiary)", pointerEvents: "none" }}>
              🔍
            </span>
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Search for a movie to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{ borderRadius: 24, paddingLeft: "2.5rem", fontSize: "var(--font-size-base)", border: "2px solid var(--color-border)" }}
            />
          </div>
          {searchActive ? (
            <Button
              variant="outline-secondary"
              onClick={clearSearch}
              style={{ borderRadius: 24, whiteSpace: "nowrap", padding: "0.5rem 1.25rem" }}
            >
              Clear
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={searchLoading || !searchQuery.trim()}
              style={{ borderRadius: 24, whiteSpace: "nowrap", padding: "0.5rem 1.25rem" }}
            >
              {searchLoading ? <Spinner animation="border" size="sm" /> : "Search"}
            </Button>
          )}
        </div>
      </div>
      )}

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
              {searchLoading
                ? "Searching..."
                : filteredSearchResults.length === searchResults.length
                  ? `${searchResults.length} results`
                  : `${filteredSearchResults.length} of ${searchResults.length} results`}
            </h6>
          </div>
          {filteredSearchResults.map((movie) => {
            const existing = moviesByTmdbId[movie.tmdbId];
            const contributions = socialByTmdbId[movie.tmdbId];
            const cardRatings = (existing && (existing.imdbRating != null || existing.rtRating != null))
              ? { imdbRating: existing.imdbRating, rtRating: existing.rtRating }
              : ratingsByTmdbId[movie.tmdbId];

            return (
              <MovieResultCard
                key={movie.tmdbId}
                movie={movie}
                socialContributions={contributions}
                ratings={cardRatings}
                myRating={existing && !existing._isShared ? existing.rating : null}
                existingStatus={existing?.status}
                onSelect={handleQuickAdd}
                onClick={(m) => {
                  if (existing) {
                    setViewDetailItem(existing);
                  } else {
                    setViewDetailItem(buildPreviewItem(m));
                  }
                }}
              />
            );
          })}
          {!searchLoading && filteredSearchResults.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--color-text-tertiary)", padding: "2rem 0" }}>
              {searchResults.length === 0
                ? "No results found. Try a different title."
                : "No results match the active filter."}
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
              const contributions = [];
              // Recommender contributions
              const recs = Array.isArray(item.recommendedBy) ? item.recommendedBy : (item.recommendedBy ? [item.recommendedBy] : []);
              recs.forEach((r) => {
                if (r.rating || r.snaps?.length > 0) {
                  contributions.push({
                    userId: r.userId,
                    displayName: r.displayName || "Someone",
                    isOwner: false,
                    isMine: false,
                    rating: r.rating || null,
                    snaps: r.snaps || [],
                    photos: r.photos || [],
                    whyNotes: "",
                    avatarUrl: null,
                  });
                }
              });
              // Social circle contributions (other people who logged the same movie)
              const entries = item.tmdbId && socialByTmdbId[item.tmdbId];
              if (entries) {
                entries.filter((c) => c.userId !== item._sharedByUserId || !item._isShared).forEach((c) => {
                  if (!contributions.find((x) => x.userId === c.userId)) contributions.push(c);
                });
              }
              if (contributions.length === 0) return null;
              const count = contributions.length;
              return (
                <SocialMemoriesCard
                  item={item}
                  contributions={contributions}
                  title="From My Circle"
                  subtitle={`${count} ${count === 1 ? "person" : "people"} rated this`}
                />
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
        message="Movie saved 🎬"
      />

      <SnapCaptureModal
        show={showSnapPrompt}
        onClose={dismissSnapPrompt}
        onSave={handleSnapSave}
        itemTitle={snapPromptTitle}
      />

      {activeDetail && (
        <EntryDetailPanel
          item={activeDetail}
          category="movies"
          schema={movieSchema}
          onClose={closeDetail}
          onSave={(data) => { saveDetailEdit(data); closeDetail(); }}
          onDelete={(id) => { deleteItem(id); closeDetail(); }}
          renderCustomView={({ item, onEdit, onDelete }) => (
            <MovieDetailView
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={handleStatusChange}
              onQuickAdd={(m, s) => { handleQuickAdd(m, s); closeDetail(); }}
              onOpenMovie={openMoviePreview}
              onBack={previewStack.length > 0 ? popPreview : undefined}
              onRatingsLoaded={handleRatingsLoaded}
              onRate={handleRate}
            />
          )}
        />
      )}
    </>
  );
}

export default MovieList;
