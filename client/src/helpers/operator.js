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

// Determines if a field should be shown based on other form values
// Handles multiple dependencies too (visibleWhen: { type: 'Car', ownership: 'Leased' })
export const isFieldVisible = (field, formData) => {
  if (!field.visibleWhen) return true;

  return Object.entries(field.visibleWhen).every(([key, expectedValue]) => {
    return Array.isArray(expectedValue)
      ? expectedValue.includes(formData[key])
      : formData[key] === expectedValue;
  });
};
