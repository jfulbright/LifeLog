import { getCountryName, getCountryContinent, CONTINENT_LABELS, TOTAL_COUNTRIES } from "../data/countries";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Returns the number of days between two YYYY-MM-DD date strings. */
function daysBetween(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

/**
 * Compute personal travel statistics from an array of travel items.
 * All computation is client-side; no extra API calls.
 */
export function computeTravelStats(items) {
  const visited = items.filter((i) => i.status === "visited");
  const wishlist = items.filter((i) => i.status === "wishlist");

  // Unique country codes
  const visitedCountryCodes = [...new Set(visited.map((i) => i.country).filter(Boolean))];
  const wishlistCountryCodes = [...new Set(wishlist.map((i) => i.country).filter(Boolean))];

  // Continents visited (derived from country codes)
  const visitedContinentCodes = [
    ...new Set(visitedCountryCodes.map(getCountryContinent).filter(Boolean)),
  ];

  // Unique cities
  const visitedCities = [...new Set(visited.map((i) => i.city).filter(Boolean))];

  // Trips by year
  const tripsByYear = {};
  visited.forEach((item) => {
    if (!item.startDate) return;
    const year = new Date(item.startDate + "T00:00:00").getFullYear();
    tripsByYear[year] = (tripsByYear[year] || 0) + 1;
  });

  // Trip durations (parallel array to visited)
  const tripDurations = visited.map((item) => daysBetween(item.startDate, item.endDate));
  const totalDays = tripDurations.reduce((sum, d) => sum + d, 0);
  const avgTripDays = visited.length > 0 ? Math.round(totalDays / visited.length) : 0;

  // Longest trip
  let longestTripIdx = -1;
  let longestTripDays = 0;
  tripDurations.forEach((d, i) => {
    if (d > longestTripDays) { longestTripDays = d; longestTripIdx = i; }
  });
  const longestTrip = longestTripIdx >= 0
    ? { item: visited[longestTripIdx], days: longestTripDays }
    : null;

  // Most visited country
  const countryFreq = {};
  visited.forEach((item) => {
    if (item.country) countryFreq[item.country] = (countryFreq[item.country] || 0) + 1;
  });
  const mostVisitedEntry = Object.entries(countryFreq).sort((a, b) => b[1] - a[1])[0];
  const mostVisitedCountry = mostVisitedEntry
    ? { code: mostVisitedEntry[0], name: getCountryName(mostVisitedEntry[0]), count: mostVisitedEntry[1] }
    : null;

  // Favorite travel month
  const monthFreq = {};
  visited.forEach((item) => {
    if (!item.startDate) return;
    const month = new Date(item.startDate + "T00:00:00").getMonth();
    monthFreq[month] = (monthFreq[month] || 0) + 1;
  });
  const favoriteMonthEntry = Object.entries(monthFreq).sort((a, b) => b[1] - a[1])[0];
  const favoriteMonth = favoriteMonthEntry ? MONTH_NAMES[Number(favoriteMonthEntry[0])] : null;

  // International vs domestic
  const internationalCount = visited.filter((i) => i.country && i.country !== "US").length;
  const internationalRatio = visited.length > 0
    ? Math.round((internationalCount / visited.length) * 100)
    : 0;

  // Top companions
  const companionFreq = {};
  visited.forEach((item) => {
    (item.companions || []).forEach((c) => {
      const name = c.displayName || c.name || (typeof c === "string" ? c : "");
      if (name) companionFreq[name] = (companionFreq[name] || 0) + 1;
    });
  });
  const topCompanions = Object.entries(companionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Countries by continent breakdown
  const continentBreakdown = {};
  visitedCountryCodes.forEach((code) => {
    const cont = getCountryContinent(code);
    if (!cont) return;
    if (!continentBreakdown[cont]) continentBreakdown[cont] = [];
    continentBreakdown[cont].push({ code, name: getCountryName(code) });
  });

  // This-year stats
  const currentYear = new Date().getFullYear();
  const visitedThisYear = visited.filter(
    (i) => i.startDate && new Date(i.startDate + "T00:00:00").getFullYear() === currentYear
  );
  const tripsThisYear = visitedThisYear.length;
  const countriesThisYear = new Set(visitedThisYear.map((i) => i.country).filter(Boolean)).size;
  const daysThisYear = visitedThisYear.reduce(
    (sum, item) => sum + daysBetween(item.startDate, item.endDate),
    0
  );

  return {
    totalTrips: visited.length,
    totalWishlist: wishlist.length,
    visitedCountries: visitedCountryCodes.map((code) => ({ code, name: getCountryName(code) })),
    visitedCountryCount: visitedCountryCodes.length,
    wishlistCountries: wishlistCountryCodes.map((code) => ({ code, name: getCountryName(code) })),
    wishlistCountryCount: wishlistCountryCodes.length,
    totalCountries: TOTAL_COUNTRIES,
    percentOfWorld: Math.round((visitedCountryCodes.length / TOTAL_COUNTRIES) * 100),
    visitedContinents: visitedContinentCodes.map((c) => ({ code: c, name: CONTINENT_LABELS[c] })),
    visitedContinentCount: visitedContinentCodes.length,
    visitedCities,
    visitedCityCount: visitedCities.length,
    tripsByYear,
    totalDays,
    avgTripDays,
    longestTrip,
    mostVisitedCountry,
    favoriteMonth,
    internationalRatio,
    topCompanions,
    continentBreakdown,
    currentYear,
    tripsThisYear,
    countriesThisYear,
    daysThisYear,
  };
}

/** Format a country progress label. */
export function formatCountryProgress(visitedCount, total = TOTAL_COUNTRIES) {
  const pct = Math.round((visitedCount / total) * 100);
  return `${visitedCount} of ${total} countries · ${pct}% of the world`;
}
