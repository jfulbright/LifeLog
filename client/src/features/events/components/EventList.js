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
import { RATING_PILL_OPTIONS, matchesRatingValue } from "../../../components/shared/GroupedDropdownFilter";
import useCategory from "../../../hooks/useCategory";
import useListFilters from "../../../hooks/useListFilters";
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
  const [filterType, setFilterType] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const { profile } = useAppData();
  const {
    items: events,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm, saveDetailEdit,
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
  const lf = useListFilters(events, { dateField: "startDate" });
  const commonFiltered = lf.applyCommonFilters(statusFiltered);

  const filteredEvents = useMemo(() => {
    let items = commonFiltered;
    if (filterType !== "all") items = items.filter((i) => i.eventType === filterType);
    if (ratingFilter !== "all") items = items.filter((i) => matchesRatingValue(i.rating, ratingFilter));
    return items;
  }, [commonFiltered, filterType, ratingFilter]);

  const sectionTitle = `Events - ${getStatusLabel("events", filterStatus)}`;

  const eventPills = [
    {
      key: "type",
      label: "🎟️ Type",
      value: filterType,
      onChange: setFilterType,
      options: EVENT_TYPES.map((t) => ({
        value: t.value,
        label: `${EVENT_TYPE_EMOJIS[t.value] || "📌"} ${t.label}`,
      })),
    },
    { key: "rating", label: "★ Rating", value: ratingFilter, onChange: setRatingFilter, options: RATING_PILL_OPTIONS },
  ];

  const getEventDisplayType = (item) => {
    return typeLabels[item.eventType] || "Event";
  };

  return (
    <>
      <CategoryListHeader
        title={"\u{1F39F}\uFE0F Events"}
        addLabel="+ Add Event"
        onAdd={openForm}
        stats={events.length > 0 ? (() => {
          const attended = events.filter((e) => e.status === "attended");
          const upcoming = events.filter((e) => e.status === "wishlist");
          const rated = attended.filter((e) => e.rating > 0);
          const avgRating = rated.length > 0 ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length).toFixed(1) : null;
          const venues = new Set(attended.map((e) => e.venue).filter(Boolean));
          const stats = [
            { value: attended.length, label: "attended", color: "var(--color-events)" },
          ];
          if (venues.size > 0) stats.push({ value: venues.size, label: "venues", color: "var(--color-primary)" });
          if (avgRating) stats.push({ value: avgRating + "★", label: "avg", color: "var(--color-warning)" });
          if (upcoming.length > 0) stats.push({ value: upcoming.length, label: "upcoming", color: "var(--color-text-secondary)" });
          return stats;
        })() : null}
        statsLink={{ to: "/events/stats", color: "var(--color-events)" }}
        category="events"
        statusOptions={eventStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        yearOptions={lf.yearOptions}
        activeYear={lf.activeYear}
        onYearChange={lf.setActiveYear}
        filterPills={eventPills}
        filterColor="var(--color-events)"
        sourceFilter={lf.sourceFilter}
        onSourceChange={lf.setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={lf.sharedCount}
        recommendedCount={lf.recommendedCount}
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
          isEditing={editIndex !== null}
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
          onSave={(data) => { saveDetailEdit(data); setViewDetailItem(null); }}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
        />
      )}
    </>
  );
}

export default EventList;
