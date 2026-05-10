import React, { useState, useRef, useEffect } from "react";
import { Button, Badge, Modal, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import TravelForm from "../../../features/travel/components/TravelForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import StatusToggle from "../../../components/shared/StatusToggle";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import WorldMapView from "../../../features/travel/components/WorldMapView";
import PhotoGrid from "../../../components/shared/PhotoGrid";
import travelSchema from "../../../features/travel/travelSchema";
import useCategory from "../../../hooks/useCategory";
import { codeToFlag, getCountryName } from "../../../data/countries";
import dataService from "../../../services/dataService";
import { computeTravelStats } from "../../../services/travelStats";
import { getTripPhotos } from "../../../helpers/operator";
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
  Object.values(groups).forEach((g) =>
    g.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
  );
  return { groups, ungrouped };
}

/** Compact stats strip shown above the filter toggle. */
function TravelMiniStats({ items }) {
  const stats = computeTravelStats(items);
  if (stats.totalTrips === 0) return null;
  return (
    <div style={{
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      alignItems: "center",
      background: "linear-gradient(135deg, #EAF8FE 0%, #F5EEF8 100%)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      padding: "0.55rem 1rem",
      marginBottom: "0.75rem",
      fontSize: "var(--font-size-sm)",
    }}>
      <span style={{ fontWeight: 800, color: "var(--color-travel)" }}>{stats.visitedCountryCount}</span>
      <span style={{ color: "var(--color-text-secondary)" }}>countries</span>
      <span style={{ color: "var(--color-text-tertiary)" }}>·</span>
      <span style={{ fontWeight: 800, color: "var(--color-events)" }}>{stats.visitedContinentCount}</span>
      <span style={{ color: "var(--color-text-secondary)" }}>continents</span>
      {stats.totalDays > 0 && (
        <>
          <span style={{ color: "var(--color-text-tertiary)" }}>·</span>
          <span style={{ fontWeight: 800, color: "var(--color-success)" }}>{stats.totalDays}</span>
          <span style={{ color: "var(--color-text-secondary)" }}>days traveling</span>
        </>
      )}
      {stats.tripsThisYear > 0 && (
        <>
          <span style={{ color: "var(--color-text-tertiary)" }}>·</span>
          <span style={{ color: "var(--color-text-secondary)" }}>
            <span style={{ fontWeight: 800, color: "var(--color-warning)" }}>{stats.tripsThisYear}</span>{" "}
            trips in {stats.currentYear}
          </span>
        </>
      )}
      <Link
        to="/travel/stats"
        style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--color-travel)", textDecoration: "none" }}
      >
        Full Stats →
      </Link>
    </div>
  );
}

/** Collapsible itinerary accordion header with full metadata and actions. */
function ItineraryHeader({ items, tripName, tripId, onAddStop, isCollapsed, onToggle, onRename, onUngroup }) {
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(tripName || "");
  const [showOverflow, setShowOverflow] = useState(false);

  const sorted = [...items].sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
  const firstDate = sorted[0]?.startDate;
  const lastDate = [...sorted].reverse().find((i) => i.endDate)?.endDate || sorted[sorted.length - 1]?.startDate;
  const totalDays = firstDate && lastDate
    ? Math.round((new Date(lastDate + "T00:00:00") - new Date(firstDate + "T00:00:00")) / 86400000) + 1
    : null;

  const formatDateRange = () => {
    if (!firstDate) return null;
    const s = new Date(firstDate + "T00:00:00");
    const opts = { month: "short", day: "numeric" };
    if (!lastDate || lastDate === firstDate) {
      return s.toLocaleDateString("en-US", { ...opts, year: "numeric" });
    }
    const e = new Date(lastDate + "T00:00:00");
    if (s.getFullYear() !== e.getFullYear()) {
      return `${s.toLocaleDateString("en-US", { ...opts, year: "numeric" })} – ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
    }
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  };

  const stops = sorted.map((item) => {
    const city = item.city || getCountryName(item.country) || "Stop";
    const flag = item.country ? codeToFlag(item.country) : "📍";
    return `${flag} ${city}`;
  }).join(" → ");

  const dateRange = formatDateRange();

  const handleRenameSubmit = () => {
    if (renameValue.trim()) onRename(tripId, renameValue.trim());
    setRenaming(false);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #EAF8FE 0%, #F5EEF8 100%)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      marginBottom: "0.5rem",
      overflow: "visible",
    }}>
      <div
        onClick={!renaming ? onToggle : undefined}
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          cursor: renaming ? "default" : "pointer",
          userSelect: "none",
        }}
      >
        {/* Left: title + metadata */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {renaming ? (
            <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") setRenaming(false); }}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  padding: "0.25rem 0.5rem",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: 700,
                  flex: 1,
                  minWidth: 0,
                  background: "#fff",
                }}
              />
              <button
                type="button"
                onClick={handleRenameSubmit}
                style={{ border: "none", background: "none", cursor: "pointer", fontWeight: 700, color: "var(--color-travel)" }}
              >
                ✓
              </button>
            </div>
          ) : (
            <div style={{ fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.15rem" }}>
              🗺️ {tripName || "Multi-Stop Trip"}
            </div>
          )}

          {!renaming && (
            <>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "0.3rem" }}>
                {stops}
              </div>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.35rem" }}>
                <span style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: "0.1rem 0.45rem",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                }}>
                  {items.length} stop{items.length !== 1 ? "s" : ""}
                </span>
                {dateRange && (
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>{dateRange}</span>
                )}
                {totalDays != null && totalDays > 0 && (
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                    {totalDays} day{totalDays !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {/* Combined trip photo strip — only shown when stops have photos */}
              {getTripPhotos(items).length > 0 && (
                <div style={{ marginTop: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                  <PhotoGrid photos={getTripPhotos(items)} height={80} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: action buttons + chevron */}
        <div
          style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {onAddStop && (
            <Button
              size="sm"
              variant="outline-primary"
              onClick={onAddStop}
              style={{ whiteSpace: "nowrap", fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
            >
              + Stop
            </Button>
          )}

          {/* Overflow menu */}
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowOverflow((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.2rem 0.45rem",
                borderRadius: 4,
                color: "var(--color-text-tertiary)",
                fontSize: "1.1rem",
                lineHeight: 1,
                letterSpacing: "0.05em",
              }}
              title="More actions"
            >
              ···
            </button>
            {showOverflow && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                zIndex: 1000,
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--card-radius)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                minWidth: 150,
                overflow: "hidden",
              }}>
                <button
                  type="button"
                  onClick={() => { setRenaming(true); setRenameValue(tripName || ""); setShowOverflow(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", background: "none", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", fontSize: "var(--font-size-sm)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  ✏️ Rename
                </button>
                <button
                  type="button"
                  onClick={() => { onUngroup(tripId); setShowOverflow(false); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", background: "none", border: "none", cursor: "pointer", fontSize: "var(--font-size-sm)", color: "#dc3545" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-surface-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  🔓 Ungroup stops
                </button>
              </div>
            )}
          </div>

          {/* Collapse chevron */}
          <span style={{
            color: "var(--color-text-tertiary)",
            fontSize: "0.75rem",
            transition: "transform 0.2s",
            transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
            display: "inline-block",
            marginLeft: "0.1rem",
          }}>
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}

/** Single linked activity row with expand/collapse for detailed fields. */
function LinkedActivityRow({ activity }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const snapshots = [activity.snapshot1, activity.snapshot2, activity.snapshot3].filter(Boolean);

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "0.35rem", marginBottom: "0.35rem" }}>
      {/* Collapsed summary row */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "var(--font-size-sm)", paddingTop: "0.2rem" }}>
        <span>🏔️</span>
        <span style={{ fontWeight: 600, flex: 1 }}>{activity.activityType || "Activity"}</span>
        {(activity.locationName || activity.city) && (
          <span style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>
            {activity.locationName || activity.city}
          </span>
        )}
        {activity.startDate && (
          <span style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>
            {formatDate(activity.startDate)}
          </span>
        )}
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-travel)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            padding: "0 0.25rem",
            whiteSpace: "nowrap",
          }}
        >
          {expanded ? "Hide ▲" : "Details ▼"}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ paddingLeft: "1.6rem", paddingTop: "0.4rem", paddingBottom: "0.25rem" }}>
          {activity.startDate && (
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "0.2rem" }}>
              <span style={{ fontWeight: 600 }}>Date: </span>
              {formatDate(activity.startDate)}
              {activity.endDate && activity.endDate !== activity.startDate
                ? ` – ${formatDate(activity.endDate)}`
                : ""}
            </div>
          )}
          {(activity.locationName || activity.city) && (
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "0.2rem" }}>
              <span style={{ fontWeight: 600 }}>Location: </span>
              {[activity.locationName, activity.city].filter(Boolean).join(", ")}
            </div>
          )}
          {activity.rating && (
            <div style={{ fontSize: "var(--font-size-xs)", color: "#f5a623", marginBottom: "0.2rem" }}>
              {"★".repeat(parseInt(activity.rating, 10))}
              {"☆".repeat(5 - parseInt(activity.rating, 10))}
            </div>
          )}
          {snapshots.map((snap, i) => (
            <div key={i} style={{ fontStyle: "italic", fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "0.2rem" }}>
              ✨ "{snap}"
            </div>
          ))}
          {activity.notes && (
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "0.2rem" }}>
              {activity.notes}
            </div>
          )}
          <Link
            to="/activities"
            style={{ fontSize: "var(--font-size-xs)", color: "var(--color-travel)", fontWeight: 600, textDecoration: "none" }}
          >
            Open in Activities →
          </Link>
        </div>
      )}
    </div>
  );
}

/** Read-only trip detail card shown in map view after clicking a trip row. */
function TripDetailPeek({ trip, linkedActivities, onEdit, onClose }) {
  const flag = trip.country ? codeToFlag(trip.country) : "📍";
  const countryName = trip.country ? getCountryName(trip.country) : "";
  const location = [trip.city, countryName].filter(Boolean).join(", ");
  const snapshots = [trip.snapshot1, trip.snapshot2, trip.snapshot3].filter(Boolean);
  const linked = linkedActivities.filter((a) => a.linkedTripId === trip.id);

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const statusVariant = trip.status === "visited" ? "success" : trip.status === "wishlist" ? "warning" : "secondary";

  return (
    <div style={{
      marginTop: "0.75rem",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      padding: "1rem 1.25rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
            <Badge bg={statusVariant} className={statusVariant === "warning" ? "text-dark" : ""}>
              {trip.status}
            </Badge>
            <span style={{ fontWeight: 700, fontSize: "var(--font-size-sm)" }}>
              {trip.title || location || "Trip"}
            </span>
          </div>
          {location && (
            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              {flag} {location}
            </div>
          )}
          {trip.startDate && (
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.15rem" }}>
              {formatDate(trip.startDate)}
              {trip.endDate && trip.endDate !== trip.startDate ? ` – ${formatDate(trip.endDate)}` : ""}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "1.1rem", lineHeight: 1, flexShrink: 0 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Snapshots */}
      {snapshots.map((snap, i) => (
        <div key={i} style={{
          fontStyle: "italic",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          marginBottom: "0.4rem",
          paddingLeft: "0.5rem",
          borderLeft: "2px solid var(--color-border)",
        }}>
          ✨ "{snap}"
        </div>
      ))}

      {/* Linked activities */}
      {linked.length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "0.75rem", paddingTop: "0.65rem" }}>
          <div style={{
            fontWeight: 700,
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.3rem",
          }}>
            Activities on this trip
          </div>
          {linked.map((a) => (
            <div key={a.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.2rem 0", fontSize: "var(--font-size-sm)" }}>
              <span>🏔️</span>
              <span style={{ fontWeight: 600 }}>{a.activityType || "Activity"}</span>
              {(a.locationName || a.city) && (
                <span style={{ color: "var(--color-text-tertiary)" }}>· {a.locationName || a.city}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <Button variant="primary" size="sm" onClick={onEdit}>Edit Trip</Button>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

const VIEW_TABS = [
  { id: "list", label: "📋 List" },
  { id: "map", label: "🗺️ Map" },
];

function TravelList() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("list");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraryName, setItineraryName] = useState("");
  const [checkedTripIds, setCheckedTripIds] = useState(new Set());
  const [itinerarySaving, setItinerarySaving] = useState(false);
  const [collapsedItineraries, setCollapsedItineraries] = useState(new Set());
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [linkedActivities, setLinkedActivities] = useState([]);
  const [mapPeekTrip, setMapPeekTrip] = useState(null);
  const lastSavedRef = useRef(null);

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

  // Load activities once to show back-references in trip cards
  useEffect(() => {
    dataService.getItems("activities").then(setLinkedActivities);
  }, []);

  const travelStatuses = getStatusFilterOptions("travel");
  const filteredTravels = filterByStatus(travels, filterStatus);
  const sectionTitle = `Travel - ${getStatusLabel("travel", filterStatus)}`;

  const { groups, ungrouped } = groupByItinerary(filteredTravels);
  const { ungrouped: allUngrouped } = groupByItinerary(travels);

  const handleAddStop = (tripId, tripName) => {
    setFormData({ tripId, tripName });
    openForm();
  };

  const toggleItineraryCollapse = (tripId) => {
    setCollapsedItineraries((prev) => {
      const next = new Set(prev);
      if (next.has(tripId)) next.delete(tripId);
      else next.add(tripId);
      return next;
    });
  };

  const handleRenameItinerary = (tripId, newName) => {
    batchPatch((item) => item.tripId === tripId, { tripName: newName });
  };

  const handleUngroupItinerary = (tripId) => {
    batchPatch((item) => item.tripId === tripId, { tripId: "", tripName: "" });
  };

  // Detects new trips and shows next-steps card after save
  const wrapSubmit = (e) => {
    const isNew = editIndex === null;
    if (isNew) lastSavedRef.current = { ...formData };
    handleSubmit(e);
    if (isNew) setShowNextSteps(true);
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

  // Renders expandable linked activity rows inside an expanded trip card
  const renderItemExtras = (trip) => {
    const linked = linkedActivities.filter((a) => a.linkedTripId === trip.id);
    if (linked.length === 0) return null;
    return (
      <div style={{
        borderTop: "1px solid var(--color-border)",
        marginTop: "0.75rem",
        paddingTop: "0.65rem",
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "0.35rem",
        }}>
          Activities on this trip
        </div>
        {linked.map((a) => (
          <LinkedActivityRow key={a.id} activity={a} />
        ))}
      </div>
    );
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
                <button
                  type="button"
                  onClick={() => { setSelectedCountry(null); setMapPeekTrip(null); }}
                  style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1rem", color: "var(--color-text-tertiary)" }}
                >
                  ×
                </button>
              </div>
              {selectedCountry.trips.length === 0 && (
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => { setFormData({ country: selectedCountry.code }); openForm(); }}
                >
                  + Add to Wishlist
                </Button>
              )}
              {selectedCountry.trips.map((trip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (trip.id) setMapPeekTrip(travels.find((t) => t.id === trip.id) || null);
                  }}
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    width: "100%",
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    borderRadius: 6,
                    padding: "0.35rem 0.5rem",
                    marginBottom: "0.15rem",
                    cursor: trip.id ? "pointer" : "default",
                    fontSize: "var(--font-size-sm)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (trip.id) e.currentTarget.style.background = "var(--color-surface-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  <Badge bg={trip.status === "visited" ? "success" : "warning"} className={trip.status === "wishlist" ? "text-dark" : ""}>
                    {trip.status}
                  </Badge>
                  <span style={{ fontWeight: 600, flex: 1 }}>{trip.title || trip.city || "Trip"}</span>
                  {trip.startDate && (
                    <span style={{ color: "var(--color-text-tertiary)" }}>
                      {new Date(trip.startDate + "T00:00:00").getFullYear()}
                    </span>
                  )}
                  {trip.id && (
                    <span style={{ color: "var(--color-text-tertiary)", fontSize: "0.85rem" }}>›</span>
                  )}
                </button>
              ))}
            </div>
          )}
          {mapPeekTrip && (
            <TripDetailPeek
              trip={mapPeekTrip}
              linkedActivities={linkedActivities}
              onEdit={() => { startEditing(mapPeekTrip.id); setMapPeekTrip(null); setSelectedCountry(null); }}
              onClose={() => setMapPeekTrip(null)}
            />
          )}
        </div>
      )}

      {/* List View */}
      {activeView === "list" && (
        <>
          {/* Post-save next-steps card */}
          {showNextSteps && (
            <div style={{
              background: "linear-gradient(135deg, #E8F8F5 0%, #EAF8FE 100%)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--card-radius)",
              padding: "0.9rem 1.1rem",
              marginBottom: "1rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem" }}>
                <div style={{ fontWeight: 700, fontSize: "var(--font-size-sm)" }}>
                  ✅ Trip saved! What would you like to do next?
                </div>
                <button
                  type="button"
                  onClick={() => setShowNextSteps(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: "1rem", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => {
                    setShowNextSteps(false);
                    navigate("/activities", {
                      state: { prefilledTripTitle: lastSavedRef.current?.title || lastSavedRef.current?.city },
                    });
                  }}
                >
                  🏔️ Log an Activity
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    setShowNextSteps(false);
                    setFormData({
                      tripId: lastSavedRef.current?.tripId || "",
                      tripName: lastSavedRef.current?.tripName || "",
                      country: lastSavedRef.current?.country || "",
                    });
                    openForm();
                  }}
                >
                  ➕ Add Another Stop
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setShowNextSteps(false)}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Inline travel stats strip */}
          <TravelMiniStats items={travels} />

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
          {Object.entries(groups).map(([tripId, groupItems]) => {
            const isCollapsed = collapsedItineraries.has(tripId);
            return (
              <div key={tripId} className="mb-2">
                <ItineraryHeader
                  items={groupItems}
                  tripName={groupItems[0]?.tripName}
                  tripId={tripId}
                  onAddStop={() => handleAddStop(tripId, groupItems[0]?.tripName)}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleItineraryCollapse(tripId)}
                  onRename={handleRenameItinerary}
                  onUngroup={handleUngroupItinerary}
                />
                {!isCollapsed && (
                  <ItemCardList
                    category="travel"
                    items={groupItems}
                    schema={travelSchema}
                    onEdit={startEditing}
                    onDelete={deleteItem}
                    renderItemExtras={renderItemExtras}
                  />
                )}
              </div>
            );
          })}

          {/* Standalone items */}
          {ungrouped.length > 0 && (
            <ItemCardList
              category="travel"
              title={Object.keys(groups).length > 0 ? "Individual Trips" : sectionTitle}
              items={ungrouped}
              schema={travelSchema}
              onEdit={startEditing}
              onDelete={deleteItem}
              renderItemExtras={renderItemExtras}
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
          onSubmit={wrapSubmit}
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
