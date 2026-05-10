import React, { useState } from "react";
import { Button, Badge, Modal, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import TravelForm from "../../../features/travel/components/TravelForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import StatusToggle from "../../../components/shared/StatusToggle";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import WorldMapView from "../../../features/travel/components/WorldMapView";
import travelSchema from "../../../features/travel/travelSchema";
import useCategory from "../../../hooks/useCategory";
import { codeToFlag, getCountryName } from "../../../data/countries";
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

function migrateMemoryToSnapshot(item) {
  if (item.memory1 !== undefined || item.memory2 !== undefined || item.memory3 !== undefined) {
    const migrated = { ...item };
    if (migrated.memory1 !== undefined) { migrated.snapshot1 = migrated.snapshot1 || migrated.memory1; delete migrated.memory1; }
    if (migrated.memory2 !== undefined) { migrated.snapshot2 = migrated.snapshot2 || migrated.memory2; delete migrated.memory2; }
    if (migrated.memory3 !== undefined) { migrated.snapshot3 = migrated.snapshot3 || migrated.memory3; delete migrated.memory3; }
    return migrated;
  }
  return item;
}

/**
 * Groups travel items by tripId. Items without a tripId are returned as
 * individual single-item groups.
 */
function groupByItinerary(items) {
  const groups = {};
  const ungrouped = [];
  items.forEach((item) => {
    if (item.tripId) {
      if (!groups[item.tripId]) groups[item.tripId] = [];
      groups[item.tripId].push(item);
    } else {
      ungrouped.push(item);
    }
  });
  // Sort each itinerary group by startDate
  Object.values(groups).forEach((g) =>
    g.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
  );
  return { groups, ungrouped };
}

/** Mini row showing the city stops in an itinerary. */
function ItineraryHeader({ items, tripName, onAddStop }) {
  const stops = items.map((item) => {
    const city = item.city || getCountryName(item.country) || "Stop";
    const flag = item.country ? codeToFlag(item.country) : "📍";
    return `${flag} ${city}`;
  }).join(" → ");

  const firstYear = items[0]?.startDate
    ? new Date(items[0].startDate + "T00:00:00").getFullYear()
    : null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #EAF8FE 0%, #F5EEF8 100%)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      padding: "0.75rem 1rem",
      marginBottom: "0.5rem",
    }}>
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.2rem" }}>
            🗺️ {tripName || "Multi-Stop Trip"}
            {firstYear && <span style={{ fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: "0.5rem", fontSize: "var(--font-size-sm)" }}>{firstYear}</span>}
          </div>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>{stops}</div>
        </div>
        {onAddStop && (
          <Button size="sm" variant="outline-primary" onClick={onAddStop} style={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
            + Add Stop
          </Button>
        )}
      </div>
    </div>
  );
}

const VIEW_TABS = [
  { id: "list", label: "📋 List" },
  { id: "map", label: "🗺️ Map" },
];

function TravelList() {
  const [activeView, setActiveView] = useState("list");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraryName, setItineraryName] = useState("");
  const [checkedTripIds, setCheckedTripIds] = useState(new Set());
  const [itinerarySaving, setItinerarySaving] = useState(false);

  const {
    items: travels,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, batchPatch, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
  } = useCategory("travel", { migrate: migrateMemoryToSnapshot, schema: travelSchema });

  const travelStatuses = getStatusFilterOptions("travel");
  const filteredTravels = filterByStatus(travels, filterStatus);
  const sectionTitle = `Travel - ${getStatusLabel("travel", filterStatus)}`;

  const { groups, ungrouped } = groupByItinerary(filteredTravels);

  // All ungrouped trips regardless of current status filter — used in the Create Itinerary modal
  const { ungrouped: allUngrouped } = groupByItinerary(travels);

  // Pre-fill tripId + tripName when "adding a stop" to an existing itinerary
  const handleAddStop = (tripId, tripName) => {
    setFormData({ tripId, tripName });
    openForm();
  };

  const openItineraryModal = () => {
    setItineraryName("");
    setCheckedTripIds(new Set());
    setShowItineraryModal(true);
  };

  const toggleTripCheck = (id) => {
    setCheckedTripIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateItinerary = () => {
    if (checkedTripIds.size < 2 || !itineraryName.trim()) return;
    setItinerarySaving(true);
    const tripId = crypto.randomUUID();
    batchPatch((item) => checkedTripIds.has(item.id), {
      tripId,
      tripName: itineraryName.trim(),
    });
    setShowItineraryModal(false);
    setItinerarySaving(false);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>✈️ Travel</h4>
        <div className="d-flex gap-2">
          <Link to="/travel/stats" className="btn btn-sm btn-outline-secondary">
            📊 Stats
          </Link>
          {allUngrouped.length >= 2 && (
            <Button variant="outline-secondary" size="sm" onClick={openItineraryModal}>
              🗺️ Create Itinerary
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={openForm}>
            + Add Trip
          </Button>
        </div>
      </div>

      {/* View tabs */}
      <div className="d-flex gap-2 mb-3">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveView(tab.id)}
            style={{
              padding: "0.3rem 0.9rem",
              borderRadius: "20px",
              border: "2px solid var(--color-travel)",
              background: activeView === tab.id ? "var(--color-travel)" : "transparent",
              color: activeView === tab.id ? "#fff" : "var(--color-travel)",
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Map View */}
      {activeView === "map" && (
        <div>
          <WorldMapView
            items={travels}
            onCountryClick={({ code, name, data }) => {
              setSelectedCountry({ code, name, trips: data?.trips || [] });
            }}
          />
          {selectedCountry && (
            <div style={{
              marginTop: "1rem",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--card-radius)",
              padding: "1rem 1.25rem",
            }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 style={{ fontWeight: 700, margin: 0 }}>
                  {codeToFlag(selectedCountry.code)} {selectedCountry.name}
                </h6>
                <button type="button" onClick={() => setSelectedCountry(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1rem", color: "var(--color-text-tertiary)" }}>×</button>
              </div>
              {selectedCountry.trips.length === 0 && (
                <Button size="sm" variant="outline-primary" onClick={() => { setFormData({ country: selectedCountry.code }); openForm(); }}>
                  + Add to Wishlist
                </Button>
              )}
              {selectedCountry.trips.map((trip, i) => (
                <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem", fontSize: "var(--font-size-sm)" }}>
                  <Badge bg={trip.status === "visited" ? "success" : "warning"} className={trip.status === "wishlist" ? "text-dark" : ""}>
                    {trip.status}
                  </Badge>
                  <span style={{ fontWeight: 600 }}>{trip.title || trip.city || "Trip"}</span>
                  {trip.startDate && <span style={{ color: "var(--color-text-tertiary)" }}>· {new Date(trip.startDate + "T00:00:00").getFullYear()}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {activeView === "list" && (
        <>
          <StatusToggle
            category="travel"
            options={travelStatuses}
            value={filterStatus}
            onChange={setFilterStatus}
          />

          {filteredTravels.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ backgroundColor: "var(--color-travel)", color: "#fff" }}>
                &#9992;&#65039;
              </div>
              <div className="empty-state-title">
                {travels.length === 0 ? "No trips yet ✈️" : "No matches"}
              </div>
              <div className="empty-state-text">
                {travels.length === 0
                  ? "Add your first trip to start tracking."
                  : "No trips match this filter."}
              </div>
              {travels.length === 0 && (
                <Button variant="primary" onClick={openForm}>
                  Add Your First Trip
                </Button>
              )}
            </div>
          )}

          {/* Itinerary groups */}
          {Object.entries(groups).map(([tripId, groupItems]) => (
            <div key={tripId} className="mb-2">
              <ItineraryHeader
                items={groupItems}
                tripName={groupItems[0]?.tripName}
                onAddStop={() => handleAddStop(tripId, groupItems[0]?.tripName)}
              />
              <ItemCardList
                category="travel"
                items={groupItems}
                schema={travelSchema}
                onEdit={startEditing}
                onDelete={deleteItem}
              />
            </div>
          ))}

          {/* Standalone items */}
          {ungrouped.length > 0 && (
            <ItemCardList
              category="travel"
              title={Object.keys(groups).length > 0 ? "Individual Trips" : sectionTitle}
              items={ungrouped}
              schema={travelSchema}
              onEdit={startEditing}
              onDelete={deleteItem}
            />
          )}
        </>
      )}

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Trip" : "Add Trip"}
      >
        <TravelForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Trip saved ✅"
      />

      <SnapCaptureModal
        show={showSnapPrompt}
        onClose={dismissSnapPrompt}
        onSave={handleSnapSave}
        itemTitle={snapPromptTitle}
      />

      {/* Create Itinerary Modal */}
      <Modal show={showItineraryModal} onHide={() => setShowItineraryModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontWeight: 700, fontSize: "1.1rem" }}>🗺️ Create Itinerary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
            Select two or more standalone trips to group into a multi-stop itinerary.
          </p>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>Itinerary Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Europe Summer 2025"
              value={itineraryName}
              onChange={(e) => setItineraryName(e.target.value)}
              style={{ fontSize: "var(--font-size-sm)" }}
            />
          </Form.Group>
          <Form.Label style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
            Select Trips ({checkedTripIds.size} selected)
          </Form.Label>
          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--color-border)", borderRadius: 8 }}>
            {allUngrouped.map((trip) => {
              const label = trip.title || trip.city || getCountryName(trip.country) || "Untitled";
              const flag = trip.country ? codeToFlag(trip.country) : "📍";
              const year = trip.startDate
                ? new Date(trip.startDate + "T00:00:00").getFullYear()
                : null;
              return (
                <label
                  key={trip.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.65rem 1rem",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border)",
                    background: checkedTripIds.has(trip.id) ? "var(--color-surface-hover)" : "transparent",
                    transition: "background 0.1s",
                  }}
                >
                  <Form.Check
                    type="checkbox"
                    checked={checkedTripIds.has(trip.id)}
                    onChange={() => toggleTripCheck(trip.id)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: "1.1rem" }}>{flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                      {trip.status}{year ? ` · ${year}` : ""}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" size="sm" onClick={() => setShowItineraryModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateItinerary}
            disabled={checkedTripIds.size < 2 || !itineraryName.trim() || itinerarySaving}
          >
            {itinerarySaving ? "Saving…" : `Group ${checkedTripIds.size} Trips`}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TravelList;
