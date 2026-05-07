import { useState, useEffect, useCallback } from "react";
import dataService from "services/dataService";
import { hasAnySnapshot } from "helpers/operator";

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
 * @param {function} [options.migrate] - Optional migration function applied to each item on load
 * @param {function} [options.normalize] - Optional normalization function applied before save
 * @param {Array} [options.schema] - Optional schema array to derive default values from
 */
export default function useCategory(category, { migrate, normalize, schema } = {}) {
  const [items, setItems] = useState(() => {
    let loaded = dataService.getItems(category);
    if (migrate) loaded = loaded.map(migrate);
    return loaded;
  });

  const [formData, setFormData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showToast, setShowToast] = useState(false);

  const [showSnapPrompt, setShowSnapPrompt] = useState(false);
  const [snapPromptItemIndex, setSnapPromptItemIndex] = useState(null);
  const [snapPromptTitle, setSnapPromptTitle] = useState("");

  useEffect(() => {
    dataService.saveItems(category, items);
  }, [category, items]);

  const handleSubmit = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault();
      const data = normalize ? normalize(formData) : formData;
      let savedIndex;

      if (editIndex !== null) {
        setItems((prev) => prev.map((item, i) => (i === editIndex ? data : item)));
        savedIndex = editIndex;
        setEditIndex(null);
      } else {
        setItems((prev) => {
          savedIndex = prev.length;
          return [...prev, data];
        });
      }
      setFormData({});
      setShowForm(false);

      const isExperienced = EXPERIENCED_STATUSES.has(data.status);
      if (isExperienced && !hasAnySnapshot(data)) {
        const title =
          data.artist || data.title || data.type || data.make || "this entry";
        setSnapPromptTitle(title);
        setSnapPromptItemIndex(savedIndex);
        setShowSnapPrompt(true);
      } else {
        setShowToast(true);
      }
    },
    [formData, editIndex, normalize]
  );

  const handleSnapSave = useCallback(
    (snapData) => {
      if (snapPromptItemIndex !== null && Object.keys(snapData).length > 0) {
        setItems((prev) =>
          prev.map((item, i) =>
            i === snapPromptItemIndex ? { ...item, ...snapData } : item
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
    (index) => {
      setFormData(items[index]);
      setEditIndex(index);
      setShowForm(true);
    },
    [items]
  );

  const deleteItem = useCallback(
    (index) => {
      setItems((prev) => prev.filter((_, i) => i !== index));
      if (editIndex === index) {
        setFormData({});
        setEditIndex(null);
        setShowForm(false);
      }
    },
    [editIndex]
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
  };
}
