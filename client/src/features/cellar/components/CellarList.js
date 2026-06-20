import React, { useState, useMemo } from "react";
import { Button } from "react-bootstrap";
import CellarForm from "./CellarForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_PILL_OPTIONS, matchesRatingValue } from "../../../components/shared/GroupedDropdownFilter";
import cellarSchema, { WINE_TYPES, WHISKEY_TYPES } from "../cellarSchema";
import useCategory from "../../../hooks/useCategory";
import useListFilters from "../../../hooks/useListFilters";
import { useAppData } from "../../../contexts/AppDataContext";
import {
  getStatusFilterOptions,
  filterByStatus,
} from "../../../helpers/filterUtils";

const WINE_TYPE_EMOJIS = {
  Red: "\u{1F534}", White: "\u26AA", "Ros\u00E9": "\u{1F338}", Sparkling: "\u2728",
  Dessert: "\u{1F36F}", Fortified: "\u{1F3F0}", Orange: "\u{1F7E0}",
};

const WHISKEY_TYPE_EMOJIS = {
  Bourbon: "\u{1F1FA}\u{1F1F8}", Scotch: "\u{1F3F4}", Rye: "\u{1F33E}", Irish: "\u{1F1EE}\u{1F1EA}",
  Japanese: "\u{1F1EF}\u{1F1F5}", Canadian: "\u{1F1E8}\u{1F1E6}", Other: "\u{1F4CC}",
};

function CellarList() {
  const [subTypeFilter, setSubTypeFilter] = useState("all");
  const [wineTypeFilter, setWineTypeFilter] = useState("all");
  const [varietalFilter, setVarietalFilter] = useState("all");
  const [whiskeyTypeFilter, setWhiskeyTypeFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const { profile } = useAppData();

  const {
    items: cellarItems,
    loading,
    formData,
    setFormData,
    showForm,
    editIndex,
    filterStatus,
    setFilterStatus,
    showToast,
    setShowToast,
    handleSubmit,
    startEditing,
    deleteItem,
    closeForm,
    openForm,
    saveDetailEdit,
    showSnapPrompt,
    snapPromptTitle,
    handleSnapSave,
    dismissSnapPrompt,
    viewDetailItem,
    setViewDetailItem,
  } = useCategory("cellar", { schema: cellarSchema });

  const cellarStatuses = getStatusFilterOptions("cellar");
  const statusFiltered = filterByStatus(cellarItems, filterStatus);
  const lf = useListFilters(cellarItems, { dateField: "startDate" });
  const commonFiltered = lf.applyCommonFilters(statusFiltered);

  const availableVarietals = useMemo(() => {
    const wineItems = cellarItems.filter((i) => (i.subType || "wine") === "wine" && i.varietal);
    const varietalSet = new Set(wineItems.map((i) => i.varietal));
    return [...varietalSet].sort();
  }, [cellarItems]);

  // Contextual multi-pill model: a persistent Type pill (Wine/Whiskey) drives
  // which sub-pills show; with no Type chosen, both sets are available. Each pill
  // holds its own value so selections combine (e.g. Wine + Red + 4★).
  const isWineCtx = (v) => v.subtype === "all" || v.subtype === "wine";
  const isWhiskeyCtx = (v) => v.subtype === "all" || v.subtype === "whiskey";
  const cellarPills = useMemo(() => {
    const pills = [
      {
        key: "subtype",
        label: "\u{1F37E} Type",
        allLabel: "All Types",
        value: subTypeFilter,
        onChange: setSubTypeFilter,
        options: [
          { value: "wine", label: "\u{1F377} Wine" },
          { value: "whiskey", label: "\u{1F943} Whiskey" },
        ],
      },
      {
        key: "wineType",
        label: "\u{1F347} Wine Type",
        value: wineTypeFilter,
        onChange: setWineTypeFilter,
        options: WINE_TYPES.map((t) => ({ value: t, label: `${WINE_TYPE_EMOJIS[t] || "\u{1F377}"} ${t}` })),
        visibleWhen: isWineCtx,
      },
    ];
    if (availableVarietals.length > 0) {
      pills.push({
        key: "varietal",
        label: "\u{1F377} Varietal",
        value: varietalFilter,
        onChange: setVarietalFilter,
        options: availableVarietals.map((v) => ({ value: v, label: v })),
        visibleWhen: isWineCtx,
      });
    }
    pills.push({
      key: "whiskeyType",
      label: "\u{1F943} Whiskey Type",
      value: whiskeyTypeFilter,
      onChange: setWhiskeyTypeFilter,
      options: WHISKEY_TYPES.map((t) => ({ value: t, label: `${WHISKEY_TYPE_EMOJIS[t] || "\u{1F943}"} ${t}` })),
      visibleWhen: isWhiskeyCtx,
    });
    pills.push({
      key: "rating",
      label: "★ Rating",
      value: ratingFilter,
      onChange: setRatingFilter,
      options: RATING_PILL_OPTIONS,
    });
    return pills;
  }, [availableVarietals, subTypeFilter, wineTypeFilter, varietalFilter, whiskeyTypeFilter, ratingFilter]);

  const filteredItems = useMemo(() => {
    let items = commonFiltered;
    if (subTypeFilter !== "all") items = items.filter((i) => (i.subType || "wine") === subTypeFilter);
    if (wineTypeFilter !== "all") items = items.filter((i) => i.wineType === wineTypeFilter);
    if (varietalFilter !== "all") items = items.filter((i) => i.varietal === varietalFilter);
    if (whiskeyTypeFilter !== "all") items = items.filter((i) => i.whiskyType === whiskeyTypeFilter);
    if (ratingFilter !== "all") items = items.filter((i) => matchesRatingValue(i.rating, ratingFilter));
    return items;
  }, [commonFiltered, subTypeFilter, wineTypeFilter, varietalFilter, whiskeyTypeFilter, ratingFilter]);

  const getItemIcon = (item) => {
    return (item.subType || "wine") === "whiskey" ? "\u{1F943}" : "\u{1F377}";
  };

  const triedCount = cellarItems.filter((i) => i.status === "tried").length;
  const totalBottles = cellarItems
    .filter((i) => i.status === "cellar")
    .reduce((sum, i) => sum + (Number(i.bottleCount) || 1), 0);

  return (
    <>
      <CategoryListHeader
        title={"\u{1F377} Cellar"}
        addLabel="+ Add Bottle"
        onAdd={openForm}
        stats={cellarItems.length > 0 ? [
          ...(triedCount > 0 ? [{ value: triedCount, label: "enjoyed", color: "var(--color-cellar, #8B3A8F)" }] : []),
          ...(totalBottles > 0 ? [{ value: totalBottles, label: "in cellar", color: "var(--color-cellar, #8B3A8F)" }] : []),
          ...(cellarItems.filter((i) => i.status === "wishlist").length > 0
            ? [{ value: cellarItems.filter((i) => i.status === "wishlist").length, label: "on wishlist" }]
            : []),
        ] : null}
        category="cellar"
        statusOptions={cellarStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        yearOptions={lf.yearOptions}
        activeYear={lf.activeYear}
        onYearChange={lf.setActiveYear}
        filterPills={cellarPills}
        filterColor="var(--color-cellar, #8B3A8F)"
        sourceFilter={lf.sourceFilter}
        onSourceChange={lf.setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={lf.sharedCount}
        recommendedCount={lf.recommendedCount}
      />

      {filteredItems.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-cellar, #8B3A8F)", color: "#fff" }}>
            🍷
          </div>
          <div className="empty-state-title">
            {cellarItems.length === 0 ? "No bottles logged yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {cellarItems.length === 0
              ? "Start logging wines and whiskeys you've enjoyed, bottles in your cellar, or ones on your wishlist."
              : "No items match this filter."}
          </div>
          {cellarItems.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Log Your First Bottle
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="cellar"
        items={filteredItems}
        schema={cellarSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
        onViewDetail={setViewDetailItem}
        renderCompactExtra={(item) => {
          const isWhiskey = item.subType === "whiskey";
          const parts = isWhiskey
            ? [item.distillery, item.whiskyType, item.ageStatement, item.region].filter(Boolean)
            : [item.vintage, item.varietal, item.region, item.linkedTripTitle ? `✈️ ${item.linkedTripTitle}` : null].filter(Boolean);
          return parts.length > 0 ? (
            <div
              style={{
                marginTop: "0.2rem",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-tertiary)",
              }}
            >
              {getItemIcon(item)} {parts.join(" · ")}
            </div>
          ) : null;
        }}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Bottle" : "Log Bottle"}
      >
        <CellarForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Bottle logged 🥂"
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
          category="cellar"
          schema={cellarSchema}
          onClose={() => setViewDetailItem(null)}
          onSave={(data) => { saveDetailEdit(data); setViewDetailItem(null); }}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
        />
      )}
    </>
  );
}

export default CellarList;
