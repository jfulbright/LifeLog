import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import CellarForm from "./CellarForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import StatusToggle from "../../../components/shared/StatusToggle";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import cellarSchema, { WINE_TYPES } from "../cellarSchema";
import useCategory from "../../../hooks/useCategory";
import {
  getStatusFilterOptions,
  filterByStatus,
} from "../../../helpers/filterUtils";

const CELLAR_COLOR = "var(--color-cellar, #8B3A8F)";

function SubTypeFilter({ value, onChange }) {
  const options = [
    { key: "all", label: "All" },
    { key: "wine", label: "Wine" },
    { key: "whiskey", label: "Whiskey" },
  ];
  return (
    <div className="d-flex gap-2 flex-wrap mb-3">
      {options.map(({ key, label }) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: "0.3rem 0.8rem",
              borderRadius: "20px",
              border: `2px solid ${CELLAR_COLOR}`,
              background: isActive ? CELLAR_COLOR : "transparent",
              color: isActive ? "#fff" : CELLAR_COLOR,
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function WineTypeFilter({ value, onChange }) {
  return (
    <div className="d-flex gap-2 flex-wrap mb-3">
      {["All", ...WINE_TYPES].map((type) => {
        const key = type === "All" ? "all" : type;
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: "16px",
              border: `1.5px solid ${CELLAR_COLOR}`,
              background: isActive ? CELLAR_COLOR : "transparent",
              color: isActive ? "#fff" : CELLAR_COLOR,
              fontWeight: 500,
              fontSize: "0.7rem",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
              opacity: 0.85,
            }}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}

function CellarStats({ items }) {
  const stats = useMemo(() => {
    const tried = items.filter((i) => i.status === "tried");
    const cellar = items.filter((i) => i.status === "cellar");
    const wishlist = items.filter((i) => i.status === "wishlist");
    const wines = items.filter((i) => (i.subType || "wine") === "wine");
    const whiskeys = items.filter((i) => i.subType === "whiskey");

    const totalBottles = cellar.reduce((sum, i) => sum + (Number(i.bottleCount) || 1), 0);
    const totalInvested = cellar.reduce(
      (sum, i) => sum + (Number(i.bottleCount) || 1) * (Number(i.purchasePrice) || 0),
      0
    );

    return {
      tried: tried.length,
      wishlist: wishlist.length,
      totalBottles,
      totalInvested,
      wineCount: wines.length,
      whiskeyCount: whiskeys.length,
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FAF0FB 0%, #F5EAF8 100%)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--card-radius)",
        padding: "0.75rem 1rem",
        marginBottom: "1rem",
        display: "flex",
        gap: "1.5rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          color: "var(--color-text-secondary)",
          fontSize: "var(--font-size-xs)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Your cellar
      </div>
      {stats.tried > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: CELLAR_COLOR }}>{stats.tried}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            enjoyed
          </span>
        </div>
      )}
      {stats.wishlist > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: CELLAR_COLOR }}>{stats.wishlist}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            on wishlist
          </span>
        </div>
      )}
      {stats.totalBottles > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: CELLAR_COLOR }}>{stats.totalBottles}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            in cellar
          </span>
        </div>
      )}
      {stats.totalInvested > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: CELLAR_COLOR }}>
            ${stats.totalInvested.toLocaleString()}
          </span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            invested
          </span>
        </div>
      )}
      {stats.wineCount > 0 && stats.whiskeyCount > 0 && (
        <div>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            <strong style={{ color: CELLAR_COLOR }}>{stats.wineCount}</strong> wines ·{" "}
            <strong style={{ color: CELLAR_COLOR }}>{stats.whiskeyCount}</strong> whiskeys
          </span>
        </div>
      )}
    </div>
  );
}

function CellarList() {
  const [subTypeFilter, setSubTypeFilter] = React.useState("all");
  const [wineTypeFilter, setWineTypeFilter] = React.useState("all");

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
    showSnapPrompt,
    snapPromptTitle,
    handleSnapSave,
    dismissSnapPrompt,
  } = useCategory("cellar", { schema: cellarSchema });

  const cellarStatuses = getStatusFilterOptions("cellar");
  const statusFiltered = filterByStatus(cellarItems, filterStatus);

  const filteredItems = useMemo(() => {
    let items = statusFiltered;
    if (subTypeFilter !== "all") {
      items = items.filter((i) => (i.subType || "wine") === subTypeFilter);
    }
    if (subTypeFilter === "wine" && wineTypeFilter !== "all") {
      items = items.filter((i) => i.wineType === wineTypeFilter);
    }
    return items;
  }, [statusFiltered, subTypeFilter, wineTypeFilter]);

  const getItemIcon = (item) => {
    return (item.subType || "wine") === "whiskey" ? "🥃" : "🍷";
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>
          🍷 Cellar
        </h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Add Bottle
        </Button>
      </div>

      <CellarStats items={cellarItems} />

      <StatusToggle
        category="cellar"
        options={cellarStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      <SubTypeFilter value={subTypeFilter} onChange={setSubTypeFilter} />

      {subTypeFilter === "wine" && (
        <WineTypeFilter value={wineTypeFilter} onChange={setWineTypeFilter} />
      )}

      {filteredItems.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: CELLAR_COLOR, color: "#fff" }}>
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
    </>
  );
}

export default CellarList;
