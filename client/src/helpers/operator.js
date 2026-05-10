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

/** Returns an array of up to 3 photo URLs on a single item, filtering empty slots. */
export const getItemPhotos = (item) =>
  [item.photo1, item.photo2, item.photo3].filter(Boolean);

/**
 * Returns the owner's photos and each companion's overlay photos separately.
 * @param {object} item - The entry item
 * @param {object[]} overlays - personalOverlay records for this entry
 */
export const getEntryPhotos = (item, overlays = []) => {
  const own = getItemPhotos(item);
  const shared = overlays
    .map((o) => ({
      contactId: o.contactId,
      photos: [o.photo1, o.photo2, o.photo3].filter(Boolean),
    }))
    .filter((o) => o.photos.length > 0);
  return { own, shared };
};

/**
 * Collects all photos across all stops in a trip itinerary (for the combined view).
 * @param {object[]} tripItems - Travel entries sharing a tripId
 */
export const getTripPhotos = (tripItems) =>
  tripItems.flatMap((item) => getItemPhotos(item));
