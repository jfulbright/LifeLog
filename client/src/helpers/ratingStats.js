/**
 * Shared rating math (Epic F / F1). One source of truth for the 1–5 star average
 * so every category computes it identically (filter out unrated `0`s, then mean).
 */

/** Parse the rating field to ints and drop unrated (<= 0) entries. */
export function extractRatings(items, ratingKey = "rating") {
  return (items || [])
    .map((i) => parseInt(i?.[ratingKey], 10))
    .filter((r) => r > 0);
}

/** Mean of a numeric array, 0 when empty. */
export function avgOf(nums) {
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/** Convenience: average rating over items, honoring the unrated filter. */
export function computeAvgRating(items, ratingKey = "rating") {
  return avgOf(extractRatings(items, ratingKey));
}
