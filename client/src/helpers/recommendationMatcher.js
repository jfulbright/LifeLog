/**
 * Category-specific matching to detect if an incoming recommendation
 * corresponds to an item the user already owns.
 */

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

export function findMatchingOwnedItem(recEntry, category, ownedItems) {
  if (!recEntry || !ownedItems?.length) return null;

  switch (category) {
    case "movies":
      if (recEntry.tmdbId) {
        return ownedItems.find((item) => item.tmdbId === recEntry.tmdbId) || null;
      }
      return ownedItems.find((item) => normalize(item.title) === normalize(recEntry.title)) || null;

    case "cellar":
      return ownedItems.find((item) =>
        normalize(item.wineName) === normalize(recEntry.wineName) &&
        normalize(item.winery) === normalize(recEntry.winery)
      ) || null;

    case "activities":
      return ownedItems.find((item) =>
        item.activityType === recEntry.activityType &&
        normalize(item.title) === normalize(recEntry.title)
      ) || null;

    case "events":
      return ownedItems.find((item) =>
        (normalize(item.artist) === normalize(recEntry.artist) && item.eventType === recEntry.eventType) ||
        normalize(item.eventName) === normalize(recEntry.eventName)
      ) || null;

    default:
      return ownedItems.find((item) => normalize(item.title) === normalize(recEntry.title)) || null;
  }
}

export function mergeRecommender(existingRecommendedBy, newRecommender) {
  const entry = {
    userId: newRecommender.userId,
    displayName: newRecommender.displayName,
    entryId: newRecommender.entryId,
    acceptedAt: new Date().toISOString(),
  };

  if (Array.isArray(existingRecommendedBy)) {
    if (existingRecommendedBy.find((r) => r.userId === entry.userId)) {
      return existingRecommendedBy;
    }
    return [...existingRecommendedBy, entry];
  }

  if (existingRecommendedBy && typeof existingRecommendedBy === "object") {
    if (existingRecommendedBy.userId === entry.userId) {
      return [{ ...existingRecommendedBy, acceptedAt: existingRecommendedBy.acceptedAt || null }];
    }
    return [
      { ...existingRecommendedBy, acceptedAt: existingRecommendedBy.acceptedAt || null },
      entry,
    ];
  }

  return [entry];
}
