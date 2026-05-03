// src/utils/operator.js

const CURRENCY_FIELDS = new Set([
  "purchasePrice",
  "soldPrice",
  "monthlyRent",
]);

export const formatCurrency = (value) => {
  if (!value && value !== 0) return "";
  const numeric = String(value).replace(/[^\d.]/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(numeric));
};

export const formatCurrencyInput = (value) => {
  return String(value).replace(/[^\d]/g, "");
};

export const isCurrencyField = (name) => {
  return CURRENCY_FIELDS.has(name) || name.toLowerCase().includes("amount");
};

export const handleInputChange = (e, setter) => {
  const { name, value } = e.target;

  setter((prev) => ({
    ...prev,
    [name]: isCurrencyField(name) ? formatCurrencyInput(value) : value,
  }));
};

export const handleEditChange = (e, editData, setEditData) => {
  const { name, value } = e.target;

  setEditData({
    ...editData,
    [name]: isCurrencyField(name) ? formatCurrencyInput(value) : value,
  });
};

// Generate Google Maps link from address object
export const getGoogleMapsLink = ({ street, city, state, zip }) => {
  const query = `${street}, ${city}, ${state} ${zip}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
};

export const getSnapshotTeaser = (item) => {
  for (let i = 1; i <= 3; i++) {
    const val = item[`snapshot${i}`];
    if (val && typeof val === "string" && val.trim()) return val.trim();
  }
  return null;
};

export const getAllSnapshots = (item) => {
  const snaps = [];
  for (let i = 1; i <= 3; i++) {
    const val = item[`snapshot${i}`];
    if (val && typeof val === "string" && val.trim()) snaps.push(val.trim());
  }
  return snaps;
};

export const hasAnySnapshot = (item) => getSnapshotTeaser(item) !== null;

export const isFieldVisible = (field, formData) => {
  if (!field.visibleWhen) return true;

  return Object.entries(field.visibleWhen).every(([key, expectedValue]) => {
    return Array.isArray(expectedValue)
      ? expectedValue.includes(formData[key])
      : formData[key] === expectedValue;
  });
};
