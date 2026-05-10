import React, { useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import eventSchema, { EVENT_TYPES } from "../eventSchema";
import EventForm from "./EventForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import StatusToggle from "../../../components/shared/StatusToggle";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import useCategory from "../../../hooks/useCategory";
import dataService from "../../../services/dataService";

import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

const typeLabels = EVENT_TYPES.reduce((acc, t) => {
  acc[t.value] = t.label;
  return acc;
}, {});

function normalizeEvent(data) {
  return {
    ...data,
    eventType: data.eventType || "concert",
    setlist: Array.isArray(data.setlist) ? data.setlist : [],
    lineup: Array.isArray(data.lineup) ? data.lineup : [],
    status: data.status || "wishlist",
    startDate: data.startDate || data.date || "",
    endDate: data.endDate || data.date || "",
  };
}

function EventList() {
  const {
    items: events,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
  } = useCategory("events", { normalize: normalizeEvent, schema: eventSchema });

  // One-time migration: copy concert data into events (with eventType: "concert")
  const migrationRan = useRef(false);
  useEffect(() => {
    if (migrationRan.current || loading) return;
    migrationRan.current = true;

    (async () => {
      try {
        const concerts = await dataService.getItems("concerts");
        if (concerts.length === 0) return;

        const existingEvents = await dataService.getItems("events");
        const existingIds = new Set(existingEvents.map((e) => e.id));

        const toMigrate = concerts.filter((c) => !existingIds.has(c.id));
        if (toMigrate.length === 0) return;

        const migrated = toMigrate.map((c) => ({
          ...c,
          eventType: "concert",
        }));

        const merged = [...existingEvents, ...migrated];
        await dataService.saveItems("events", merged);
        window.dispatchEvent(new Event("data-changed"));
        window.location.reload();
      } catch (err) {
        console.error("[EventList] Concert migration failed:", err);
      }
    })();
  }, [loading]);

  const eventStatuses = getStatusFilterOptions("events");
  const filteredEvents = filterByStatus(events, filterStatus);
  const sectionTitle = `Events - ${getStatusLabel("events", filterStatus)}`;

  const getEventDisplayType = (item) => {
    return typeLabels[item.eventType] || "Event";
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>Events</h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Add Event
        </Button>
      </div>

      <StatusToggle
        category="events"
        options={eventStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      {filteredEvents.length === 0 && !showForm && !loading && (
        <div className="empty-state">
          <div
            className="empty-state-icon"
            style={{ backgroundColor: "var(--color-events)", color: "#fff" }}
          >
            🎟️
          </div>
          <div className="empty-state-title">
            {events.length === 0 ? "No events yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {events.length === 0
              ? "Log concerts, games, shows, and more."
              : "No events match this filter."}
          </div>
          {events.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Add Your First Event
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="events"
        title={sectionTitle}
        items={filteredEvents}
        schema={eventSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
        badgeAccessor={getEventDisplayType}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Event" : "Add Event"}
      >
        <EventForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Event saved ✅"
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

export default EventList;
