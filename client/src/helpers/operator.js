// src/utils/operator.js

// Format raw number string into "$15,000.00"
export const formatCurrency = (value) => {
  if (!value) return "";
  const numeric = value.replace(/[^\d]/g, "");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric / 100);
};

// Strip non-numeric characters for storing as raw cents
export const formatCurrencyInput = (value) => {
  return value.replace(/[^\d]/g, "");
};

// Generic input change handler for forms
export const handleInputChange = (e, setter) => {
  const { name, value, type } = e.target;
  const isCurrencyField =
    name.toLowerCase().includes("amount") || name === "monthlyRent";

  setter((prev) => ({
    ...prev,
    [name]: isCurrencyField ? formatCurrencyInput(value) : value,
  }));
};

// For edit forms
export const handleEditChange = (e, editData, setEditData) => {
  const { name, value } = e.target;
  const isCurrencyField =
    name.toLowerCase().includes("amount") || name === "monthlyRent";

  setEditData({
    ...editData,
    [name]: isCurrencyField ? formatCurrencyInput(value) : value,
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
    return formData[key] === expectedValue;
  });
};
