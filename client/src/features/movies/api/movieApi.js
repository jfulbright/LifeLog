const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

function getHeaders() {
  const token = process.env.REACT_APP_TMDB_ACCESS_TOKEN;
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return {};
}

function buildUrl(path) {
  const token = process.env.REACT_APP_TMDB_ACCESS_TOKEN;
  if (token) return `${TMDB_BASE}${path}`;
  const apiKey = process.env.REACT_APP_TMDB_API_KEY || "";
  if (!apiKey) throw new Error("TMDB API key not configured. Add REACT_APP_TMDB_ACCESS_TOKEN or REACT_APP_TMDB_API_KEY to your .env.local");
  const sep = path.includes("?") ? "&" : "?";
  return `${TMDB_BASE}${path}${sep}api_key=${apiKey}`;
}

export async function searchMovies(query) {
  if (!query.trim()) return [];

  const url = buildUrl(`/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  const data = await res.json();

  return (data.results || []).slice(0, 12).map((m) => ({
    tmdbId: String(m.id),
    title: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : "",
    overview: m.overview || "",
    posterUrl: m.poster_path ? `${TMDB_IMG_BASE}${m.poster_path}` : "",
    genre: (m.genre_ids || []).map((id) => GENRE_MAP[id] || "").filter(Boolean).join(", "),
  }));
}

export async function getMovieDetails(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}?language=en-US`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return null;
  const m = await res.json();

  return {
    tmdbId: String(m.id),
    title: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : "",
    overview: m.overview || "",
    posterUrl: m.poster_path ? `${TMDB_IMG_BASE}${m.poster_path}` : "",
    genre: (m.genres || []).map((g) => g.name).join(", "),
    director: "",
    runtime: m.runtime ? `${m.runtime} min` : "",
  };
}

const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export async function getWatchProviders(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/watch/providers`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  const us = data.results?.US;
  if (!us) return null;
  return {
    flatrate: (us.flatrate || []).map((p) => ({ name: p.provider_name, logo: `https://image.tmdb.org/t/p/w45${p.logo_path}` })),
    rent: (us.rent || []).map((p) => ({ name: p.provider_name, logo: `https://image.tmdb.org/t/p/w45${p.logo_path}` })),
    buy: (us.buy || []).map((p) => ({ name: p.provider_name, logo: `https://image.tmdb.org/t/p/w45${p.logo_path}` })),
    link: us.link || null,
  };
}

export async function getExternalIds(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/external_ids`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return { imdbId: data.imdb_id || null };
}

export async function getVideos(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/videos?language=en-US`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || [])
    .filter((v) => v.site === "YouTube" && v.type === "Trailer")
    .map((v) => ({ key: v.key, name: v.name, url: `https://www.youtube.com/watch?v=${v.key}` }));
}

export async function getSimilarMovies(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/similar?language=en-US&page=1`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).slice(0, 8).map((m) => ({
    tmdbId: String(m.id),
    title: m.title,
    year: m.release_date ? m.release_date.slice(0, 4) : "",
    posterUrl: m.poster_path ? `${TMDB_IMG_BASE}${m.poster_path}` : "",
    genre: (m.genre_ids || []).map((id) => GENRE_MAP[id] || "").filter(Boolean).join(", "),
  }));
}

export async function getPersonCredits(personId) {
  const url = buildUrl(`/person/${personId}/movie_credits?language=en-US`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.crew || [])
    .filter((c) => c.job === "Director")
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 8)
    .map((m) => ({
      tmdbId: String(m.id),
      title: m.title,
      year: m.release_date ? m.release_date.slice(0, 4) : "",
      posterUrl: m.poster_path ? `${TMDB_IMG_BASE}${m.poster_path}` : "",
    }));
}

export async function getMovieCredits(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/credits?language=en-US`);
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return { director: null, cast: [] };
  const data = await res.json();
  const director = (data.crew || []).find((c) => c.job === "Director");
  const cast = (data.cast || []).slice(0, 5).map((c) => ({ id: c.id, name: c.name }));
  return {
    director: director ? { id: director.id, name: director.name } : null,
    cast,
  };
}
