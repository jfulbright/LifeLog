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
