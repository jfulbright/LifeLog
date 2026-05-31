export function computeEventStats(items, period = "year") {
  let events = [...items];
  const currentYear = new Date().getFullYear();

  if (period === "year") {
    events = events.filter((e) => {
      if (!e.startDate) return false;
      return new Date(e.startDate + "T00:00:00").getFullYear() === currentYear;
    });
  } else if (period === "6mo") {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    events = events.filter((e) => {
      if (!e.startDate) return false;
      return new Date(e.startDate + "T00:00:00") >= sixMonthsAgo;
    });
  }

  const attended = events.filter((e) => e.status === "attended");
  const wishlist = events.filter((e) => e.status === "wishlist");

  const ratings = attended.map((e) => parseInt(e.rating, 10)).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => { if (ratingDistribution[r] !== undefined) ratingDistribution[r]++; });

  const typeFreq = {};
  attended.forEach((e) => {
    const t = e.eventType || "other";
    typeFreq[t] = (typeFreq[t] || 0) + 1;
  });
  const typeBreakdown = Object.entries(typeFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

  const typesExplored = Object.keys(typeFreq).length;

  const venueFreq = {};
  attended.forEach((e) => {
    if (e.venue) venueFreq[e.venue] = (venueFreq[e.venue] || 0) + 1;
  });
  const topVenues = Object.entries(venueFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const eventsByYear = {};
  attended.forEach((e) => {
    if (!e.startDate) return;
    const year = new Date(e.startDate + "T00:00:00").getFullYear();
    eventsByYear[year] = (eventsByYear[year] || 0) + 1;
  });

  const companionFreq = {};
  attended.forEach((e) => {
    (e.companions || []).forEach((c) => {
      const name = c.displayName || c.name || (typeof c === "string" ? c : "");
      if (name) companionFreq[name] = (companionFreq[name] || 0) + 1;
    });
  });
  const topCompanions = Object.entries(companionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const cityFreq = {};
  attended.forEach((e) => {
    if (e.city) cityFreq[e.city] = (cityFreq[e.city] || 0) + 1;
  });
  const topCities = Object.entries(cityFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const attendedThisYear = items.filter((e) =>
    e.status === "attended" && e.startDate &&
    new Date(e.startDate + "T00:00:00").getFullYear() === currentYear
  ).length;

  const recommendedAttended = attended.filter((e) => e._isRecommended).length;

  return {
    totalAttended: attended.length,
    totalWishlist: wishlist.length,
    avgRating,
    typesExplored,
    attendedThisYear,
    typeBreakdown,
    eventsByYear,
    ratingDistribution,
    topVenues,
    topCities,
    topCompanions,
    recommendedAttended,
    currentYear,
  };
}
