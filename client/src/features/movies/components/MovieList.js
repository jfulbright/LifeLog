import React from "react";
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

function normalizeMovie(data) {
  return {
    ...data,
    status: data.status || "watchlist",
    startDate: data.startDate || "",
  };
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

  const movieStatuses = getStatusFilterOptions("movies");
  const filteredMovies = filterByStatus(movies, filterStatus);
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
