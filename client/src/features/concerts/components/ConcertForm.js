import React, { useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import ItemForm from "components/shared/ItemForm";
import concertSchema from "features/concerts/concertSchema";
import { fetchSetlists } from "features/concerts/api/concertApi";
import CountryDropdown from "components/shared/CountryDropdown";
import StateDropdown from "components/shared/StateDropdown";
import { States } from "data/states";

const stateNameToAbbr = States.reduce((map, s) => {
  map[s.name.toLowerCase()] = s.abbreviation;
  return map;
}, {});

function normalizeStateName(raw) {
  if (!raw) return "";
  if (raw.length === 2) return raw.toUpperCase();
  return stateNameToAbbr[raw.toLowerCase()] || raw;
}

function ConcertForm({ formData, setFormData, onSubmit, onCancel }) {
  const [search, setSearch] = useState({
    artist: "",
    year: "",
    country: "",
    state: "",
  });
  const [results, setResults] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSave = (concert, status) => {
    const updated = {
      ...concert,
      setlist: Array.isArray(concert.setlist) ? concert.setlist : [],
      status: status || "wishlist",
      state: normalizeStateName(concert.state),
    };
    setFormData(updated);
    setSelectedConcert(updated);
    setResults([]);
  };

  const handleBackToSearch = () => {
    setSelectedConcert(null);
    setManualEntry(false);
  };

  // Step 2: Edit form after selecting a concert or choosing manual entry
  if (selectedConcert || manualEntry) {
    return (
      <div>
        <button
          className="item-card-toggle mb-3"
          onClick={handleBackToSearch}
        >
          &#8592; Back to Search
        </button>
        <ItemForm
          schema={concertSchema}
          formData={formData}
          setFormData={setFormData}
          onSubmit={onSubmit}
          title="Concert"
          buttonText="Concert"
        />
      </div>
    );
  }

  // Step 1: Search UI
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
          onClick={() => setManualEntry(true)}
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
            className="form-control form-select"
            value={search.state}
            onChange={(e) => setSearch({ ...search, state: e.target.value })}
          />
        </div>
        <div className="col-md-6">
          <CountryDropdown
            className="form-control form-select"
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
                    onClick={() => handleSave(concert, "attended")}
                  >
                    Attended
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    className="text-dark"
                    onClick={() => handleSave(concert, "wishlist")}
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

export default ConcertForm;
