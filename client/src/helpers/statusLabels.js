// client/src/helpers/statusLabels.js

const statusLabels = {
  cars: {
    owned: "Owned",
    wishlist: "Wishlist",
  },
  homes: {
    owned: "Owned",
    rented: "Rented",
    wishlist: "Wishlist",
  },
  travel: {
    visited: "Visited",
    wishlist: "Wishlist",
  },
  concerts: {
    attended: "Attended",
    wishlist: "Wishlist",
  },
  sports: {
    attended: "Attended",
    wishlist: "Wishlist",
  },
};

export default statusLabels;

/**
 * Helper: Returns value list for dropdowns (e.g. ["visited", "wishlist"])
 */
export const getStatusValues = (category) => {
  return Object.keys(statusLabels[category] || {});
};

/**
 * Helper: Returns display label for a specific status
 */
export const getStatusLabel = (category, status) => {
  if (status === "all") return "All";
  return statusLabels[category]?.[status] || status;
};
