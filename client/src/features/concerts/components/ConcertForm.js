import React, { useState } from "react";
import ItemForm from "components/shared/ItemForm";
import concertSchema from "features/concerts/concertSchema";
import { fetchSetlists } from "features/concerts/api/concertApi";

function ConcertForm({ formData, setFormData, onSubmit }) {
  const [search, setSearch] = useState({ artist: "", year: "" });
  const [results, setResults] = useState([]);
  const [selectedConcert, setSelectedConcert] = useState(null);

  const handleSearch = async () => {
    try {
      const concerts = await fetchSetlists(search.artist, search.year);
      setResults(concerts);
    } catch (err) {
      console.error("Error fetching concerts:", err);
      setResults([]);
    }
  };

  const handleSave = (concert, status) => {
    const updated = {
      ...concert,
      setlist: Array.isArray(concert.setlist) ? concert.setlist : [],
      status,
    };
    setFormData(updated);
    setSelectedConcert(updated);
    setResults([]);
  };

  if (selectedConcert) {
    return (
      <ItemForm
        schema={concertSchema}
        formData={formData}
        setFormData={setFormData}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <div>
      <h5>Search for a Concert</h5>
      <div className="d-flex gap-2 mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Artist"
          value={search.artist}
          onChange={(e) => setSearch({ ...search, artist: e.target.value })}
        />
        <input
          type="number"
          className="form-control"
          placeholder="Year"
          value={search.year}
          onChange={(e) => setSearch({ ...search, year: e.target.value })}
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          Search
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <h6>Results</h6>
          <ul className="list-group">
            {results.map((concert, idx) => (
              <li key={idx} className="list-group-item">
                <strong>{concert.artist}</strong> — {concert.venue},{" "}
                {concert.location}
                <div className="text-muted">{concert.date}</div>
                <div className="mt-2">
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => handleSave(concert, "visited")}
                  >
                    Save as Visited
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleSave(concert, "wishlist")}
                  >
                    Save to Wishlist
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ConcertForm;
