import { useState, useEffect, useCallback } from "react";
import dataService from "services/dataService";

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

  useEffect(() => {
    dataService.saveItems(category, items);
  }, [category, items]);

  const handleSubmit = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault();
      const data = normalize ? normalize(formData) : formData;

      if (editIndex !== null) {
        setItems((prev) => prev.map((item, i) => (i === editIndex ? data : item)));
        setEditIndex(null);
      } else {
        setItems((prev) => [...prev, data]);
      }
      setFormData({});
      setShowForm(false);
      setShowToast(true);
    },
    [formData, editIndex, normalize]
  );

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
  };
}
