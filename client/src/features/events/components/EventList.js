import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "react-bootstrap";
import eventSchema, { EVENT_TYPES } from "../eventSchema";
import EventForm from "./EventForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_GROUP } from "../../../components/shared/GroupedDropdownFilter";
import useCategory from "../../../hooks/useCategory";
import { useAppData } from "../../../contexts/AppDataContext";
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

const EVENT_TYPE_EMOJIS = {
  concert: "🎵",
  sports: "🏟️",
  broadway: "🎭",
  comedy: "😂",
  festival: "🎪",
  other: "📌",
};

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
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [filterType, setFilterType] = useState("all");
  const { profile } = useAppData();
  const {
    items: events,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
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
  const statusFiltered = filterByStatus(events, filterStatus);
  const sourceFiltered = sourceFilter === "mine"
    ? statusFiltered.filter((i) => !i._isShared)
    : sourceFilter === "shared"
    ? statusFiltered.filter((i) => i._isShared)
    : sourceFilter === "recommended"
    ? statusFiltered.filter((i) => i._isRecommended)
    : statusFiltered;

  const filteredEvents = useMemo(() => {
    if (filterType === "all") return sourceFiltered;
    if (filterType.startsWith("rating:")) {
      const rVal = filterType.split(":")[1];
      return sourceFiltered.filter((i) => {
        const r = parseInt(i.rating, 10);
        if (rVal === "unrated") return !r;
        if (rVal === "5") return r === 5;
        if (rVal === "4+") return r >= 4;
        if (rVal === "3+") return r >= 3;
        return true;
      });
    }
    return sourceFiltered.filter((i) => i.eventType === filterType);
  }, [sourceFiltered, filterType]);

  const sharedCount = events.filter((i) => i._isShared).length;
  const recommendedCount = events.filter((i) => i._isRecommended).length;
  const sectionTitle = `Events - ${getStatusLabel("events", filterStatus)}`;

  const eventFilterGroups = useMemo(() => [
    {
      key: "type",
      label: "🎟️ Type",
      options: EVENT_TYPES.map((t) => ({
        value: t.value,
        label: `${EVENT_TYPE_EMOJIS[t.value] || "📌"} ${t.label}`,
      })),
    },
    RATING_GROUP,
  ], []);

  const getEventDisplayType = (item) => {
    return typeLabels[item.eventType] || "Event";
  };

  return (
    <>
      <CategoryListHeader
        title={"\u{1F39F}\uFE0F Events"}
        addLabel="+ Add Event"
        onAdd={openForm}
        stats={events.length > 0 ? [
          { value: events.filter((e) => e.status === "attended").length, label: "attended", color: "var(--color-events)" },
          { value: events.filter((e) => e.status === "wishlist").length, label: "upcoming", color: "var(--color-text-secondary)" },
        ] : null}
        category="events"
        statusOptions={eventStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterGroups={eventFilterGroups}
        filterValue={filterType}
        onFilterChange={setFilterType}
        filterColor="var(--color-events)"
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={sharedCount}
        recommendedCount={recommendedCount}
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
        onViewDetail={setViewDetailItem}
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

      {viewDetailItem && (
        <EntryDetailPanel
          item={viewDetailItem}
          category="events"
          schema={eventSchema}
          onClose={() => setViewDetailItem(null)}
          onSave={() => setViewDetailItem(null)}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
        />
      )}
    </>
  );
}

export default EventList;
