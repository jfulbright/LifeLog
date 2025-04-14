// NO api key exposed in frontend!
export async function fetchSetlists(artist, year) {
  const response = await fetch(
    `http://localhost:5050/api/setlists?artist=${artist}&year=${year}`
  );

  if (!response.ok) throw new Error("Failed to fetch setlists");

  const data = await response.json();

  return (
    data.setlist?.map((item) => {
      const setlist = Array.isArray(item.sets?.set?.[0]?.song)
        ? item.sets.set[0].song.map((s) => s.name)
        : [];

      return {
        artist: item.artist?.name || artist,
        date: item.eventDate || "",
        venue: item.venue?.name || "",
        location: `${item.venue?.city?.name || ""}, ${
          item.venue?.city?.country?.code || ""
        }`,
        tour: item.tour?.name || "",
        setlist,
        sourceUrl: `https://www.setlist.fm/setlist/${item.artist?.name}/${item.id}`,
        type: "concert",
        status: "visited",
      };
    }) || []
  );
}
