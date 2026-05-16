/**
 * Compute movie-watching statistics from an array of movie items.
 * All computation is client-side; no extra API calls.
 */
export function computeMovieStats(items, period = "all") {
  let movies = [...items];

  const currentYear = new Date().getFullYear();
  if (period === "year") {
    movies = movies.filter((m) => {
      if (!m.startDate) return false;
      return new Date(m.startDate + "T00:00:00").getFullYear() === currentYear;
    });
  } else if (period === "6mo") {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    movies = movies.filter((m) => {
      if (!m.startDate) return false;
      return new Date(m.startDate + "T00:00:00") >= sixMonthsAgo;
    });
  }

  const watched = movies.filter((m) => m.status === "watched");
  const watchlist = movies.filter((m) => m.status === "watchlist");

  const ratings = watched.map((m) => parseInt(m.rating, 10)).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => { if (ratingDistribution[r] !== undefined) ratingDistribution[r]++; });

  const genreFreq = {};
  watched.forEach((m) => {
    (m.genre || "").split(",").forEach((g) => {
      const trimmed = g.trim();
      if (trimmed) genreFreq[trimmed] = (genreFreq[trimmed] || 0) + 1;
    });
  });
  const genreBreakdown = Object.entries(genreFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  const directorFreq = {};
  watched.forEach((m) => {
    if (m.director) directorFreq[m.director] = (directorFreq[m.director] || 0) + 1;
  });
  const topDirectors = Object.entries(directorFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const watchedByYear = {};
  watched.forEach((m) => {
    if (!m.startDate) return;
    const year = new Date(m.startDate + "T00:00:00").getFullYear();
    watchedByYear[year] = (watchedByYear[year] || 0) + 1;
  });

  const decadeFreq = {};
  watched.forEach((m) => {
    const y = parseInt(m.year, 10);
    if (!y) return;
    let decade;
    if (y >= 2020) decade = "2020s";
    else if (y >= 2010) decade = "2010s";
    else if (y >= 2000) decade = "2000s";
    else if (y >= 1990) decade = "90s";
    else if (y >= 1980) decade = "80s";
    else if (y >= 1970) decade = "70s";
    else decade = "Classic";
    decadeFreq[decade] = (decadeFreq[decade] || 0) + 1;
  });

  const genresExplored = Object.keys(genreFreq).length;

  const watchedThisYear = items.filter((m) =>
    m.status === "watched" && m.startDate &&
    new Date(m.startDate + "T00:00:00").getFullYear() === currentYear
  ).length;

  const companionFreq = {};
  watched.forEach((m) => {
    (m.companions || []).forEach((c) => {
      const name = c.displayName || c.name || (typeof c === "string" ? c : "");
      if (name) companionFreq[name] = (companionFreq[name] || 0) + 1;
    });
  });
  const topCompanions = Object.entries(companionFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const recommendedWatched = watched.filter((m) => m._isRecommended).length;

  return {
    totalWatched: watched.length,
    totalWatchlist: watchlist.length,
    avgRating,
    genresExplored,
    watchedThisYear,
    ratingDistribution,
    genreBreakdown,
    topDirectors,
    watchedByYear,
    decadeFreq,
    topCompanions,
    recommendedWatched,
    currentYear,
  };
}
