import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import dataService from "../services/dataService";
import collaboratorService from "../services/collaboratorService";
import contactsService from "../services/contactsService";
import recommendationService from "../services/recommendationService";
import { hasAnySnapshot } from "../helpers/operator";
import { enrichItemsWithSocialContent } from "../helpers/socialContent";
import { useAppData } from "../contexts/AppDataContext";

const EXPERIENCED_STATUSES = new Set([
  "attended",
  "visited",
  "owned",
  "rented",
]);

/**
 * Shared hook that encapsulates the CRUD + UI state pattern
 * duplicated across all category List components.
 *
 * @param {string} category - Category key (e.g. "travel", "concerts")
 * @param {object} options
 * @param {function} [options.migrate] - Optional migration applied to each item on load (must be stable)
 * @param {function} [options.normalize] - Optional normalization applied before save
 * @param {Array} [options.schema] - Optional schema array to derive default values from
 */
export default function useCategory(category, { migrate, normalize, schema } = {}) {
  const { contacts } = useAppData();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null); // holds item.id (UUID) while editing, null otherwise
  const [filterStatus, setFilterStatus] = useState("all");
  const [showToast, setShowToast] = useState(false);

  const [showSnapPrompt, setShowSnapPrompt] = useState(false);
  const [snapPromptItemIndex, setSnapPromptItemIndex] = useState(null);
  const [snapPromptTitle, setSnapPromptTitle] = useState("");
  const [viewDetailItem, setViewDetailItem] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // isReady: prevents saving before the initial async load completes
  // skipNextSave: skips the first post-load save (data hasn't changed — avoids a wasted API call)
  const isReady = useRef(false);
  const skipNextSave = useRef(false);
  const editParamHandled = useRef(false);

  // Async initial load — migrate is intentionally excluded from deps (must be a stable reference)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let loaded = await dataService.getItemsWithShared(category);
        if (migrate) loaded = loaded.map(migrate);
        if (normalize) loaded = loaded.map(normalize);
        loaded = loaded.map((item) =>
          item.id ? item : { ...item, id: crypto.randomUUID() }
        );
        loaded = await enrichItemsWithSocialContent(loaded, contacts);
        if (!cancelled) {
          isReady.current = true;
          skipNextSave.current = true;
          setItems(loaded);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load data");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [category, contacts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open edit form when navigated with ?edit=<itemId>
  useEffect(() => {
    if (loading || editParamHandled.current) return;
    const editId = searchParams.get("edit");
    if (editId) {
      const item = items.find((i) => i.id === editId);
      if (item) {
        setFormData(item);
        setEditIndex(editId);
        setShowForm(true);
      }
      editParamHandled.current = true;
      setSearchParams({}, { replace: true });
    }
  }, [loading, items, searchParams, setSearchParams]);

  // Persist after every mutation — skips pre-load renders and the first post-load echo
  // Only saves OWN items (not shared items from collaborators)
  useEffect(() => {
    if (!isReady.current) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const ownItems = items.filter((i) => !i._isShared);
    dataService
      .saveItems(category, ownItems)
      .then(() => window.dispatchEvent(new Event("data-changed")))
      .catch((err) => console.error("[useCategory] save failed:", err));
  }, [category, items]);

  const handleSubmit = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();

      // Strip transient sharing fields (recommendations persist in item data)
      const {
        shareWithCompanionIds,
        _recommendedCompanions,
        ...rawFormData
      } = formData;
      const data = normalize ? normalize(rawFormData) : rawFormData;
      const { recommendedToRings, recommendedToContacts } = formData;
      let savedId;

      // Shared item edit: merge only collaborator-safe fields into the existing JSONB
      if (editIndex !== null && formData._isShared) {
        const { snapshot1, snapshot2, snapshot3, photo1, photo2, photo3, rating, ...safeData } = data;
        try {
          await dataService.updateSharedItem(editIndex, safeData);
        } catch (err) {
          console.error("[useCategory] shared item update failed:", err);
        }
        setItems((prev) =>
          prev.map((item) =>
            item.id === editIndex
              ? { ...item, ...safeData, _isShared: true }
              : item
          )
        );
        skipNextSave.current = true;
        setEditIndex(null);
        setFormData({});
        setShowForm(false);
        setShowToast(true);
        return;
      }

      if (editIndex !== null) {
        savedId = editIndex;
        setItems((prev) =>
          prev.map((item) =>
            item.id === editIndex ? { ...data, id: item.id } : item
          )
        );
        setEditIndex(null);
      } else {
        const newId = crypto.randomUUID();
        const newItem = { ...data, id: newId };
        savedId = newId;
        setItems((prev) => [...prev, newItem]);
      }
      setFormData({});
      setShowForm(false);

      // Reconcile collaborator shares (add + remove). Works for both linked and
      // unlinked contacts (deferred sharing). Guarded on Array.isArray so a create
      // or edit that never touched sharing is a no-op rather than wiping shares.
      if (Array.isArray(shareWithCompanionIds)) {
        try {
          const existing = await collaboratorService.getCollaboratorsForOwnedEntry(savedId);
          const existingContactIds = existing
            .map((c) => c.collaborator_contact_id)
            .filter(Boolean);
          const toAdd = shareWithCompanionIds.filter((cid) => !existingContactIds.includes(cid));
          const toRemove = existingContactIds.filter((cid) => !shareWithCompanionIds.includes(cid));

          if (toAdd.length > 0) {
            const allContacts = await contactsService.getContacts();
            const addContacts = allContacts.filter((c) => toAdd.includes(c.id));
            if (addContacts.length > 0) {
              await collaboratorService.shareEntryWithContacts(savedId, category, addContacts);
            }
          }
          if (toRemove.length > 0) {
            await collaboratorService.unshareEntryWithContacts(savedId, toRemove);
          }
        } catch (err) {
          console.error("[useCategory] collaborator reconcile failed:", err);
        }
      }

      // Create recommendation records if user targeted rings or individuals
      if (
        (recommendedToRings?.length > 0 || recommendedToContacts?.length > 0)
      ) {
        try {
          const toUserIds = recommendedToContacts?.length
            ? await contactsService.resolveContactUserIds(recommendedToContacts)
            : [];
          await recommendationService.createRecommendations(savedId, category, {
            toUserIds,
            toRingLevels: recommendedToRings || [],
          });
        } catch (err) {
          console.error("[useCategory] recommendation create failed:", err);
        }
      }

      const isExperienced = EXPERIENCED_STATUSES.has(data.status);
      if (isExperienced && !hasAnySnapshot(data)) {
        const title =
          data.artist || data.title || data.type || data.make || "this entry";
        setSnapPromptTitle(title);
        setSnapPromptItemIndex(savedId);
        setShowSnapPrompt(true);
      } else {
        setShowToast(true);
      }
    },
    [formData, editIndex, normalize, category]
  );

  const handleSnapSave = useCallback(
    (snapData) => {
      if (snapPromptItemIndex !== null && Object.keys(snapData).length > 0) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === snapPromptItemIndex ? { ...item, ...snapData } : item
          )
        );
      }
      setShowSnapPrompt(false);
      setSnapPromptItemIndex(null);
      setSnapPromptTitle("");
      setShowToast(true);
    },
    [snapPromptItemIndex]
  );

  const dismissSnapPrompt = useCallback(() => {
    setShowSnapPrompt(false);
    setSnapPromptItemIndex(null);
    setSnapPromptTitle("");
    setShowToast(true);
  }, []);

  const startEditing = useCallback(
    async (id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setFormData(item);
      setEditIndex(id);
      setShowForm(true);

      // Hydrate shareWithCompanionIds + status from existing collaborator records
      if (!item._isShared) {
        try {
          const collabs = await collaboratorService.getCollaboratorsForOwnedEntry(id);
          const shared = collabs.filter((c) => c.collaborator_contact_id);
          if (shared.length > 0) {
            const sharedContactIds = shared.map((c) => c.collaborator_contact_id);
            const collaboratorStatuses = Object.fromEntries(
              shared.map((c) => [c.collaborator_contact_id, c.status])
            );
            setFormData((prev) => ({
              ...prev,
              shareWithCompanionIds: sharedContactIds,
              // collaborate ⟹ visible: existing collaborators must show under
              // "Who can see this" even on legacy entries saved before this field.
              visibilityContacts: Array.from(
                new Set([...(prev.visibilityContacts || []), ...sharedContactIds])
              ),
              _collaboratorStatuses: collaboratorStatuses,
            }));
          }
        } catch {}
      }
    },
    [items]
  );

  const deleteItem = useCallback(
    (id) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editIndex === id) {
        setFormData({});
        setEditIndex(null);
        setShowForm(false);
      }
    },
    [editIndex]
  );

  /**
   * Apply a patch object to every item that matches the predicate.
   * Used by batch operations like "Create Itinerary" to assign a shared tripId.
   */
  const batchPatch = useCallback((predicate, patch) => {
    setItems((prev) => prev.map((item) => predicate(item) ? { ...item, ...patch } : item));
  }, []);

  const saveDetailEdit = useCallback(
    async (updatedItem) => {
      const id = updatedItem.id;
      if (!id) return;

      const {
        shareWithCompanionIds,
        _recommendedCompanions,
        ...rawData
      } = updatedItem;
      const data = normalize ? normalize(rawData) : rawData;
      const { recommendedToRings, recommendedToContacts } = updatedItem;

      if (updatedItem._isShared) {
        const { snapshot1, snapshot2, snapshot3, photo1, photo2, photo3, rating, ...safeData } = data;
        try {
          await dataService.updateSharedItem(id, safeData);
        } catch (err) {
          console.error("[useCategory] shared detail edit failed:", err);
        }
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, ...safeData, _isShared: true }
              : item
          )
        );
        skipNextSave.current = true;
        setShowToast(true);
        return;
      } else {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...data, id } : item))
        );
      }

      // Reconcile collaborator shares: add newly-toggled companions and remove
      // the ones toggled off. Guarded on Array.isArray so an edit flow that never
      // hydrated the field (undefined) is a no-op rather than silently wiping
      // every existing share.
      if (Array.isArray(shareWithCompanionIds)) {
        try {
          const existing = await collaboratorService.getCollaboratorsForOwnedEntry(id);
          const existingContactIds = existing
            .map((c) => c.collaborator_contact_id)
            .filter(Boolean);
          const toAdd = shareWithCompanionIds.filter((cid) => !existingContactIds.includes(cid));
          const toRemove = existingContactIds.filter((cid) => !shareWithCompanionIds.includes(cid));

          if (toAdd.length > 0) {
            const allContacts = await contactsService.getContacts();
            const addContacts = allContacts.filter((c) => toAdd.includes(c.id));
            if (addContacts.length > 0) {
              await collaboratorService.shareEntryWithContacts(id, category, addContacts);
            }
          }
          if (toRemove.length > 0) {
            await collaboratorService.unshareEntryWithContacts(id, toRemove);
          }
        } catch (err) {
          console.error("[useCategory] collaborator reconcile failed:", err);
        }
      }

      // Create recommendation records if user targeted rings or individuals
      if (recommendedToRings?.length > 0 || recommendedToContacts?.length > 0) {
        try {
          const toUserIds = recommendedToContacts?.length
            ? await contactsService.resolveContactUserIds(recommendedToContacts)
            : [];
          await recommendationService.createRecommendations(id, category, {
            toUserIds,
            toRingLevels: recommendedToRings || [],
          });
        } catch (err) {
          console.error("[useCategory] recommendation create failed:", err);
        }
      }

      setShowToast(true);
      window.dispatchEvent(new Event("data-changed"));
    },
    [normalize, category]
  );

  const closeForm = useCallback(() => {
    setFormData({});
    setEditIndex(null);
    setShowForm(false);
  }, []);

  const openForm = useCallback(() => {
    const defaults = {};
    if (schema) {
      schema.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });
    }
    setFormData(defaults);
    setEditIndex(null);
    setShowForm(true);
  }, [schema]);

  return {
    items,
    loading,
    error,
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
    batchPatch,
    closeForm,
    openForm,
    saveDetailEdit,
    showSnapPrompt,
    snapPromptTitle,
    handleSnapSave,
    dismissSnapPrompt,
    viewDetailItem,
    setViewDetailItem,
  };
}
