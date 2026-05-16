const OMDB_BASE = "https://www.omdbapi.com";

export async function getOmdbRatings(imdbId) {
  const apiKey = process.env.REACT_APP_OMDB_API_KEY;
  if (!apiKey || !imdbId) return null;

  const url = `${OMDB_BASE}/?i=${encodeURIComponent(imdbId)}&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.Response === "False") return null;

  const rt = (data.Ratings || []).find((r) => r.Source === "Rotten Tomatoes");

  return {
    imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : null,
    rottenTomatoes: rt ? rt.Value : null,
    metascore: data.Metascore !== "N/A" ? data.Metascore : null,
  };
}
