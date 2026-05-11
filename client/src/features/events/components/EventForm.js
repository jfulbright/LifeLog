import React, { useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import ItemForm from "../../../components/shared/ItemForm";
import eventSchema, { EVENT_TYPES } from "../eventSchema";
import { fetchSetlists } from "../../concerts/api/concertApi";
import CountryDropdown from "../../../components/shared/CountryDropdown";
import StateDropdown from "../../../components/shared/StateDropdown";
import { States } from "../../../data/states";

const stateNameToAbbr = States.reduce((map, s) => {
  map[s.name.toLowerCase()] = s.abbreviation;
  return map;
}, {});

function normalizeStateName(raw) {
  if (!raw) return "";
  if (raw.length === 2) return raw.toUpperCase();
  return stateNameToAbbr[raw.toLowerCase()] || raw;
}

function EventForm({ formData, setFormData, onSubmit, onCancel }) {
  const [search, setSearch] = useState({
    artist: "",
    year: "",
    country: "",
    state: "",
  });
  const [results, setResults] = useState([]);
  const [searchMode, setSearchMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const eventType = formData?.eventType || "";
  const isConcert = eventType === "concert";
  const isEditing = !!formData?.artist || !!formData?.teams || !!formData?.showName ||
    !!formData?.comedian || !!formData?.festivalName || !!formData?.eventName;

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const concerts = await fetchSetlists(
        search.artist,
        search.year,
        search.country,
        search.state
      );
      setResults(concerts);
      if (concerts.length === 0) {
        setError("No results found. Try adjusting your search.");
      }
    } catch (err) {
      console.error("Error fetching concerts:", err);
      setError("Failed to search Setlist.fm. Make sure the proxy server is running.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (concert, status) => {
    const updated = {
      ...concert,
      eventType: "concert",
      setlist: Array.isArray(concert.setlist) ? concert.setlist : [],
      status: status || "wishlist",
      state: normalizeStateName(concert.state),
    };
    setFormData(updated);
    setResults([]);
    setSearchMode(false);
  };

  const handleBackToSearch = () => {
    setSearchMode(true);
    setResults([]);
  };

  // If no event type selected yet, show type picker
  if (!eventType && !isEditing) {
    return (
      <div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
          }}
        >
          What type of event?
        </div>
        <div className="row g-2">
          {EVENT_TYPES.map((t) => (
            <div key={t.value} className="col-6">
              <button
                className="btn w-100 text-start"
                style={{
                  padding: "0.75rem 1rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-surface)",
                  fontWeight: 500,
                }}
                onClick={() => {
                  setFormData({ ...formData, eventType: t.value });
                  if (t.value !== "concert") setSearchMode(false);
                }}
              >
                {t.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Concert type: show Setlist.fm search first (unless editing or manual)
  if (isConcert && searchMode && !isEditing) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Search Setlist.fm
          </span>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => setSearchMode(false)}
          >
            Add Manually
          </Button>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Artist"
              value={search.artist}
              onChange={(e) => setSearch({ ...search, artist: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <input
              type="number"
              className="form-control"
              placeholder="Year"
              inputMode="numeric"
              value={search.year}
              onChange={(e) => setSearch({ ...search, year: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <StateDropdown
              value={search.state}
              onChange={(e) => setSearch({ ...search, state: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <CountryDropdown
              value={search.country}
              onChange={(e) => setSearch({ ...search, country: e.target.value })}
            />
          </div>
        </div>

        <Button
          variant="primary"
          className="w-100 mb-3"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : "Search"}
        </Button>

        {error && (
          <Alert variant="warning" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {results.length > 0 && (
          <div>
            <h6
              style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.75rem",
              }}
            >
              Results
            </h6>
            {results.map((concert, idx) => (
              <div key={idx} className="search-result-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <strong style={{ color: "var(--color-text-primary)" }}>
                      {concert.artist}
                    </strong>
                    <span className="text-muted"> &mdash; {concert.venue}</span>
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-tertiary)",
                        marginTop: "0.25rem",
                      }}
                    >
                      {concert.city}
                      {concert.state ? `, ${concert.state}` : ""}
                      {concert.country ? `, ${concert.country}` : ""}
                      {" \u2022 "}
                      {concert.startDate}
                    </div>
                    {concert.setlist?.length > 0 && (
                      <div
                        style={{
                          fontSize: "var(--font-size-xs)",
                          color: "var(--color-text-secondary)",
                          marginTop: "0.375rem",
                        }}
                      >
                        <strong>Setlist:</strong>{" "}
                        {concert.setlist.slice(0, 3).join(", ")}
                        {concert.setlist.length > 3
                          ? ` and ${concert.setlist.length - 3} more`
                          : ""}
                      </div>
                    )}
                  </div>
                  <div className="d-flex flex-column gap-1 ms-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleSelectResult(concert, "attended")}
                    >
                      Attended
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-warning"
                      className="text-dark"
                      onClick={() => handleSelectResult(concert, "wishlist")}
                    >
                      Wishlist
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show the full form (for all types, or concert after search/manual)
  return (
    <div>
      {isConcert && !isEditing && (
        <button
          className="item-card-toggle mb-3"
          onClick={handleBackToSearch}
        >
          &#8592; Back to Search
        </button>
      )}
      <ItemForm
        schema={eventSchema}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
        title="Event"
        buttonText="Event"
      />
    </div>
  );
}

export default EventForm;
