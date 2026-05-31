export function computeActivityStats(items, period = "year") {
  let activities = [...items];
  const currentYear = new Date().getFullYear();

  if (period === "year") {
    activities = activities.filter((a) => {
      if (!a.startDate) return false;
      return new Date(a.startDate + "T00:00:00").getFullYear() === currentYear;
    });
  } else if (period === "6mo") {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    activities = activities.filter((a) => {
      if (!a.startDate) return false;
      return new Date(a.startDate + "T00:00:00") >= sixMonthsAgo;
    });
  }

  const done = activities.filter((a) => a.status === "done");
  const wishlist = activities.filter((a) => a.status === "wishlist");

  const ratings = done.map((a) => parseInt(a.rating, 10)).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => { if (ratingDistribution[r] !== undefined) ratingDistribution[r]++; });

  const typeFreq = {};
  done.forEach((a) => {
    if (a.activityType) typeFreq[a.activityType] = (typeFreq[a.activityType] || 0) + 1;
  });
  const typeBreakdown = Object.entries(typeFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const typesExplored = Object.keys(typeFreq).length;

  const difficultyFreq = {};
  done.forEach((a) => {
    if (a.difficulty) difficultyFreq[a.difficulty] = (difficultyFreq[a.difficulty] || 0) + 1;
  });
  const difficultyDistribution = Object.entries(difficultyFreq)
    .sort((a, b) => {
      const order = ["Easy", "Moderate", "Hard", "Expert"];
      return order.indexOf(a[0]) - order.indexOf(b[0]);
    })
    .map(([name, count]) => ({ name, count }));

  const activitiesByYear = {};
  done.forEach((a) => {
    if (!a.startDate) return;
    const year = new Date(a.startDate + "T00:00:00").getFullYear();
    activitiesByYear[year] = (activitiesByYear[year] || 0) + 1;
  });

  const locationFreq = {};
  done.forEach((a) => {
    const loc = a.locationName || a.city;
    if (loc) locationFreq[loc] = (locationFreq[loc] || 0) + 1;
  });
  const topLocations = Object.entries(locationFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const companionFreq = {};
  done.forEach((a) => {
    (a.companions || []).forEach((c) => {
      const name = c.displayName || c.name || (typeof c === "string" ? c : "");
      if (name) companionFreq[name] = (companionFreq[name] || 0) + 1;
    });
  });
  const topCompanions = Object.entries(companionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const doneThisYear = items.filter((a) =>
    a.status === "done" && a.startDate &&
    new Date(a.startDate + "T00:00:00").getFullYear() === currentYear
  ).length;

  const recommendedDone = done.filter((a) => a._isRecommended).length;

  return {
    totalDone: done.length,
    totalWishlist: wishlist.length,
    avgRating,
    typesExplored,
    doneThisYear,
    typeBreakdown,
    difficultyDistribution,
    activitiesByYear,
    ratingDistribution,
    topLocations,
    topCompanions,
    recommendedDone,
    currentYear,
  };
}
