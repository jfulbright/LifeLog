/**
 * Category-specific matching to detect if an incoming recommendation
 * corresponds to an item the user already owns.
 */

function normalize(str) {
  return (str || "").trim().toLowerCase();
}

// Both sides must be present AND equal. Prevents two missing values (e.g. an
// undefined field on both the recommendation and the owned item) from collapsing
// to "" === "" and producing a false match.
function eqNonEmpty(a, b) {
  const na = normalize(a);
  return !!na && na === normalize(b);
}

export function findMatchingOwnedItem(recEntry, category, ownedItems) {
  if (!recEntry || !ownedItems?.length) return null;

  switch (category) {
    case "movies":
      if (recEntry.tmdbId) {
        return ownedItems.find((item) => item.tmdbId === recEntry.tmdbId) || null;
      }
      return ownedItems.find((item) => eqNonEmpty(item.title, recEntry.title)) || null;

    case "cellar":
      // wineName is the stable identifier; whiskey/other subtypes use different
      // name fields, so a missing wineName means "no confident match" → new entry.
      return ownedItems.find((item) =>
        eqNonEmpty(item.wineName, recEntry.wineName) &&
        eqNonEmpty(item.winery, recEntry.winery)
      ) || null;

    case "activities":
      return ownedItems.find((item) =>
        item.activityType === recEntry.activityType &&
        eqNonEmpty(item.title, recEntry.title)
      ) || null;

    case "events":
      // Events carry `title` (+ `artist`/`eventType`), never `eventName`. Match on
      // real fields: same artist + type, or same title. Both guarded non-empty.
      return ownedItems.find((item) =>
        (eqNonEmpty(item.artist, recEntry.artist) && item.eventType === recEntry.eventType) ||
        eqNonEmpty(item.title, recEntry.title)
      ) || null;

    default:
      return ownedItems.find((item) => eqNonEmpty(item.title, recEntry.title)) || null;
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
