export async function fetchSetlists(artist, year, country, state) {
  const queryParams = new URLSearchParams();
  if (artist) queryParams.append("artistName", artist);
  if (year) queryParams.append("year", year);
  if (country) queryParams.append("countryCode", country);
  if (state) queryParams.append("stateCode", state);

  const url = `https://api.setlist.fm/rest/1.0/search/setlists?${queryParams.toString()}`;
  const response = await fetch(
    `http://localhost:5050/api/proxy?url=${encodeURIComponent(url)}`
  );

  if (!response.ok) throw new Error("Failed to fetch setlists");

  const data = await response.json();

  return (
    data.setlist?.map((item) => {
      const rawDate = item.eventDate?.split("-").reverse().join("-") || "";

      return {
        type: "concert",
        status: "wishlist",
        artist: item.artist?.name || artist,
        venue: item.venue?.name || "",
        tour: item.tour?.name || "",
        startDate: rawDate,
        endDate: rawDate,
        setlist: Array.isArray(item.sets?.set?.[0]?.song)
          ? item.sets.set[0].song.map((s) => s.name)
          : [],
        sourceUrl: `https://www.setlist.fm/setlist/${item.artist?.name}/${item.id}`,
        city: item.venue?.city?.name || "",
        state: item.venue?.city?.state || "",
        country: item.venue?.city?.country?.code || "",
        zip: item.venue?.city?.zip || "",
      };
    }) || []
  );
}
