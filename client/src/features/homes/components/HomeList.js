import React from "react";
import { Button } from "react-bootstrap";
import HomeForm from "../../../features/homes/components/HomeForm";
import ItemCardList from "../../../components/shared/ItemCardList";
import FormPanel from "../../../components/shared/FormPanel";
import SaveToast from "../../../components/shared/SaveToast";
import SnapCaptureModal from "../../../components/shared/SnapCaptureModal";
import EntryDetailPanel from "../../../components/shared/EntryDetailPanel";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";
import { RATING_GROUP } from "../../../components/shared/GroupedDropdownFilter";
import homeSchema from "../../../features/homes/homeSchema";
import useCategory from "../../../hooks/useCategory";
import { useAppData } from "../../../contexts/AppDataContext";
import {
  getStatusFilterOptions,
  filterByStatus,
  getStatusLabel,
} from "../../../helpers/filterUtils";

function HomeList() {
  const [sourceFilter, setSourceFilter] = React.useState("all");
  const [homeFilter, setHomeFilter] = React.useState("all");
  const { profile } = useAppData();
  const {
    items: homes,
    loading,
    formData, setFormData,
    showForm, editIndex,
    filterStatus, setFilterStatus,
    showToast, setShowToast,
    handleSubmit, startEditing, deleteItem, closeForm, openForm,
    showSnapPrompt, snapPromptTitle, handleSnapSave, dismissSnapPrompt,
    viewDetailItem, setViewDetailItem,
  } = useCategory("homes", { schema: homeSchema });

  const homeStatuses = getStatusFilterOptions("homes");
  const statusFiltered = filterByStatus(homes, filterStatus);
  const sourceFiltered = sourceFilter === "mine"
    ? statusFiltered.filter((i) => !i._isShared)
    : sourceFilter === "shared"
    ? statusFiltered.filter((i) => i._isShared)
    : sourceFilter === "recommended"
    ? statusFiltered.filter((i) => i._isRecommended)
    : statusFiltered;

  const filteredHomes = React.useMemo(() => {
    if (homeFilter === "all") return sourceFiltered;
    if (homeFilter.startsWith("rating:")) {
      const rVal = homeFilter.split(":")[1];
      return sourceFiltered.filter((i) => {
        const r = parseInt(i.rating, 10);
        if (rVal === "unrated") return !r;
        if (rVal === "5") return r === 5;
        if (rVal === "4+") return r >= 4;
        if (rVal === "3+") return r >= 3;
        return true;
      });
    }
    return sourceFiltered;
  }, [sourceFiltered, homeFilter]);

  const sharedCount = homes.filter((i) => i._isShared).length;
  const recommendedCount = homes.filter((i) => i._isRecommended).length;
  const sectionTitle = `Homes - ${getStatusLabel("homes", filterStatus)}`;

  return (
    <>
      <CategoryListHeader
        title={"\u{1F3E0} Homes"}
        addLabel="+ Add Home"
        onAdd={openForm}
        stats={homes.length > 0 ? [
          { value: homes.length, label: "logged", color: "var(--color-homes, #2EB67D)" },
        ] : null}
        category="homes"
        statusOptions={homeStatuses}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filterGroups={[RATING_GROUP]}
        filterValue={homeFilter}
        onFilterChange={setHomeFilter}
        filterColor="var(--color-homes, #2EB67D)"
        sourceFilter={sourceFilter}
        onSourceChange={setSourceFilter}
        avatarUrl={profile?.avatar_url}
        sharedCount={sharedCount}
        recommendedCount={recommendedCount}
      />

      {filteredHomes.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-homes)", color: "#fff" }}>
            &#127968;
          </div>
          <div className="empty-state-title">
            {homes.length === 0 ? "No homes yet \u{1F3E0}" : "No matches"}
          </div>
          <div className="empty-state-text">
            {homes.length === 0
              ? "Add your first home to start tracking."
              : "No homes match this filter."}
          </div>
          {homes.length === 0 && (
            <Button variant="primary" onClick={openForm}>
              Add Your First Home
            </Button>
          )}
        </div>
      )}

      <ItemCardList
        category="homes"
        title={sectionTitle}
        items={filteredHomes}
        schema={homeSchema}
        onEdit={startEditing}
        onDelete={deleteItem}
        onViewDetail={setViewDetailItem}
      />

      <FormPanel
        show={showForm}
        onHide={closeForm}
        title={editIndex !== null ? "Edit Home" : "Add Home"}
      >
        <HomeForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </FormPanel>

      <SaveToast
        show={showToast}
        onClose={() => setShowToast(false)}
        message="Home saved \u2705"
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
          category="homes"
          schema={homeSchema}
          onClose={() => setViewDetailItem(null)}
          onSave={() => setViewDetailItem(null)}
          onDelete={(id) => { deleteItem(id); setViewDetailItem(null); }}
        />
      )}
    </>
  );
}

export default HomeList;
