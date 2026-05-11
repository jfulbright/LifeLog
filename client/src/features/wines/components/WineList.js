import React, { useMemo } from "react";
import { Button } from "react-bootstrap";
import WineForm from "./WineForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import StatusToggle from "../../../components/shared/StatusToggle";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import wineSchema, { WINE_TYPES } from "../wineSchema";
import useCategory from "../../../hooks/useCategory";
import {
  getStatusFilterOptions,
  filterByStatus,
} from "../../../helpers/filterUtils";

const WINE_COLOR = "var(--color-wines, #8B3A8F)";

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
              padding: "0.3rem 0.8rem",
              borderRadius: "20px",
              border: `2px solid ${WINE_COLOR}`,
              background: isActive ? WINE_COLOR : "transparent",
              color: isActive ? "#fff" : WINE_COLOR,
              fontWeight: 600,
              fontSize: "var(--font-size-sm)",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}

function WineStats({ items }) {
  const stats = useMemo(() => {
    const tried = items.filter((i) => i.status === "tried");
    const cellar = items.filter((i) => i.status === "cellar");
    const wishlist = items.filter((i) => i.status === "wishlist");

    const byType = {};
    tried.forEach((i) => {
      const t = i.wineType || "Other";
      byType[t] = (byType[t] || 0) + 1;
    });

    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];

    const totalBottles = cellar.reduce((sum, i) => sum + (Number(i.bottleCount) || 1), 0);
    const totalInvested = cellar.reduce(
      (sum, i) => sum + (Number(i.bottleCount) || 1) * (Number(i.purchasePrice) || 0),
      0
    );

    return { tried: tried.length, wishlist: wishlist.length, totalBottles, totalInvested, topType };
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
        Your wines
      </div>
      {stats.tried > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: WINE_COLOR }}>{stats.tried}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            enjoyed
          </span>
        </div>
      )}
      {stats.wishlist > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: WINE_COLOR }}>{stats.wishlist}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            on wishlist
          </span>
        </div>
      )}
      {stats.totalBottles > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: WINE_COLOR }}>{stats.totalBottles}</span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            in cellar
          </span>
        </div>
      )}
      {stats.totalInvested > 0 && (
        <div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: WINE_COLOR }}>
            ${stats.totalInvested.toLocaleString()}
          </span>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginLeft: "0.3rem" }}>
            invested
          </span>
        </div>
      )}
      {stats.topType && (
        <div>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Mostly <strong style={{ color: WINE_COLOR }}>{stats.topType[0]}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

function WineList() {
  const [wineTypeFilter, setWineTypeFilter] = React.useState("all");

  const {
    items: wines,
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
  } = useCategory("wines", { schema: wineSchema });

  const wineStatuses = getStatusFilterOptions("wines");
  const statusFiltered = filterByStatus(wines, filterStatus);
  const filteredWines =
    wineTypeFilter === "all"
      ? statusFiltered
      : statusFiltered.filter((i) => i.wineType === wineTypeFilter);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0" style={{ fontWeight: 700 }}>
          🍷 Wines
        </h4>
        <Button variant="primary" size="sm" onClick={openForm}>
          + Log Wine
        </Button>
      </div>

      <WineStats items={wines} />

      <StatusToggle
        category="wines"
        options={wineStatuses}
        value={filterStatus}
        onChange={setFilterStatus}
      />

      <WineTypeFilter value={wineTypeFilter} onChange={setWineTypeFilter} />

      {filteredWines.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: WINE_COLOR, color: "#fff" }}>
            🍷
          </div>
          <div className="empty-state-title">
            {wines.length === 0 ? "No wines logged yet" : "No matches"}
          </div>
          <div className="empty-state-text">
            {wines.length === 0
              ? "Start logging wines you've tried, bottles in your cellar, or ones on your wishlist."
              : "No wines match this filter."}
          </div>
          {wines.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Log Your First Wine
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="wines"
        items={filteredWines}
        schema={wineSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
        renderCompactExtra={(item) => {
          const parts = [
            item.vintage,
            item.varietal,
            item.region,
            item.linkedTripTitle ? `✈️ ${item.linkedTripTitle}` : null,
          ].filter(Boolean);
          return parts.length > 0 ? (
            <div
              style={{
                marginTop: "0.2rem",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-tertiary)",
              }}
            >
              {parts.join(" · ")}
            </div>
          ) : null;
        }}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Wine" : "Log Wine"}
      >
        <WineForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Wine logged 🍷"
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

export default WineList;
