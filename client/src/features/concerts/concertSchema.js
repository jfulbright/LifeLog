const concertSchema = {
  type: "concert",
  label: "Concerts",
  icon: "🎵",
  fields: [
    { name: "artist", label: "Artist", type: "text" },
    { name: "date", label: "Date", type: "date" },
    { name: "venue", label: "Venue", type: "text" },
    { name: "location", label: "Location", type: "text" },
    { name: "tour", label: "Tour Name", type: "text" },
    {
      name: "setlist",
      label: "Setlist",
      type: "list",
      placeholder: "Song name",
    },
    { name: "sourceUrl", label: "Source URL", type: "url" },
  ],
  group: "status", // uses shared visited/wishlist logic
};

export default concertSchema;
