import React, { useState, useMemo } from "react";
import { Button } from "react-bootstrap";
import movieSchema from "../movieSchema";
import MovieForm from "./MovieForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import StatusToggle from "../../../components/shared/StatusToggle";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import useCategory from "../../../hooks/useCategory";

import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

const MOVIE_COLOR = "var(--color-movies, #E01E5A)";

function normalizeMovie(data) {
  return {
    ...data,
    status: data.status || "watchlist",
    startDate: data.startDate || "",
  };
}

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

function FilterPill({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "0.25rem 0.7rem",
        borderRadius: "20px",
        border: `1.5px solid ${MOVIE_COLOR}`,
        background: isActive ? MOVIE_COLOR : "transparent",
        color: isActive ? "#fff" : MOVIE_COLOR,
        fontWeight: 600,
        fontSize: "var(--font-size-sm)",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function GenreFilter({ value, onChange, genres }) {
  if (genres.length === 0) return null;
  return (
    <div className="d-flex gap-2 flex-wrap mb-2">
      <FilterPill label="All" isActive={value === "all"} onClick={() => onChange("all")} />
      {genres.map((genre) => (
        <FilterPill
          key={genre}
          label={genre}
          isActive={value === genre}
          onClick={() => onChange(genre)}
        />
      ))}
    </div>
  );
}

function DecadeFilter({ value, onChange, decades }) {
  if (decades.length === 0) return null;
  return (
    <div className="d-flex gap-2 flex-wrap mb-2">
      <FilterPill label="All" isActive={value === "all"} onClick={() => onChange("all")} />
      {decades.map((decade) => (
        <FilterPill
          key={decade}
          label={decade}
          isActive={value === decade}
          onClick={() => onChange(decade)}
        />
      ))}
    </div>
  );
}

function RatingFilter({ value, onChange, hasRatedItems }) {
  if (!hasRatedItems) return null;
  const options = [
    { key: "all", label: "All" },
    { key: "5", label: "5 Stars" },
    { key: "4+", label: "4+" },
    { key: "3+", label: "3+" },
    { key: "unrated", label: "Unrated" },
  ];
  return (
    <div className="d-flex gap-2 flex-wrap mb-2">
      {options.map(({ key, label }) => (
        <FilterPill
          key={key}
          label={label}
          isActive={value === key}
          onClick={() => onChange(key)}
        />
      ))}
    </div>
  );
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
  } = useCategory("movies", { normalize: normalizeMovie, schema: movieSchema });

  const [genreFilter, setGenreFilter] = useState("all");
  const [decadeFilter, setDecadeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

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
    const decadeOrder = ["2020s", "2010s", "2000s", "90s", "80s", "Classic"];
    const present = new Set();
    movies.forEach((m) => {
      const d = getDecade(m.year);
      if (d) present.add(d);
    });
    return decadeOrder.filter((d) => present.has(d));
  }, [movies]);

  const hasRatedItems = useMemo(
    () => movies.some((m) => parseInt(m.rating, 10) > 0),
    [movies]
  );

  // Chain filters: status -> genre -> decade -> rating
  const statusFiltered = filterByStatus(movies, filterStatus);
  const genreFiltered = genreFilter === "all"
    ? statusFiltered
    : statusFiltered.filter((m) =>
        (m.genre || "").split(",").map((g) => g.trim()).includes(genreFilter)
      );
  const decadeFiltered = decadeFilter === "all"
    ? genreFiltered
    : genreFiltered.filter((m) => getDecade(m.year) === decadeFilter);
  const filteredMovies = ratingFilter === "all"
    ? decadeFiltered
    : decadeFiltered.filter((m) => matchesRating(m.rating, ratingFilter));

  const sectionTitle = `Movies - ${getStatusLabel("movies", filterStatus)}`;
  const watchedCount = movies.filter((m) => m.status === "watched").length;
  const watchlistCount = movies.filter((m) => m.status === "watchlist").length;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Movies</h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Add Movie
        </Button>
      </div>

      {movies.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            marginBottom: "1rem",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span><strong style={{ color: "var(--color-success)" }}>{watchedCount}</strong> watched</span>
          <span><strong style={{ color: "var(--color-warning, #F2994A)" }}>{watchlistCount}</strong> on watchlist</span>
        </div>
      )}

      <StatusToggle
        category="movies"
        options={movieStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      <GenreFilter value={genreFilter} onChange={setGenreFilter} genres={availableGenres} />
      <DecadeFilter value={decadeFilter} onChange={setDecadeFilter} decades={availableDecades} />
      <RatingFilter value={ratingFilter} onChange={setRatingFilter} hasRatedItems={hasRatedItems} />

      {filteredMovies.length === 0 && !showForm && !loading && (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-movies, #E91E63)", color: "#fff" }}
          >
            🎬
          </div>
          <div className="empty-state-title">
            {movies.length === 0 ? "No movies yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {movies.length === 0
              ? "Search TMDB or add one manually to start tracking your movie life."
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
      />

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
    </>
  );
}

export default MovieList;
