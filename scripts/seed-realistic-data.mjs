/**
 * Seed script: populates demo-quality data across movies, events, travel,
 * and activities for all 3 test users. Includes social features (collaborations,
 * overlays, recommendations).
 *
 * Run: node scripts/seed-realistic-data.mjs
 * Prerequisites: node scripts/tests/helpers/cleanup.mjs --wipe
 */

import { createClient } from "../client/node_modules/@supabase/supabase-js/dist/index.mjs";

const SUPABASE_URL = "https://wzsbatztmcdungfzgrnm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1J2xtbjBInGL-h_XiS3asA_EjQFgKzF";

const USERS = {
  jason: { email: "jfulbright+user1@gmail.com", password: "TestPass123!" },
  sarah: { email: "jfulbright+user2@gmail.com", password: "TestPass123!" },
  mike: { email: "jfulbright+user3@gmail.com", password: "TestPass123!" },
};

async function getAuthClient(user) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw new Error(`Auth failed for ${user.email}: ${error.message}`);
  return { client, userId: data.user.id };
}

const IMG = "https://image.tmdb.org/t/p/w500";

// ═══════════════════════════════════════════════════════════════════════════════
// MOVIES — Real titles with TMDB poster paths
// ═══════════════════════════════════════════════════════════════════════════════

function movie(tmdbId, title, year, genre, director, posterPath, rating, startDate, extras = {}) {
  return {
    id: crypto.randomUUID(), tmdbId: String(tmdbId), title, year: String(year), genre, director,
    posterUrl: posterPath ? `${IMG}${posterPath}` : "",
    rating, status: "watched", startDate, visibilityRings: [1, 2, 3, 4], ...extras,
  };
}

function watchlist(tmdbId, title, year, genre, director, posterPath, extras = {}) {
  return {
    id: crypto.randomUUID(), tmdbId: String(tmdbId), title, year: String(year), genre, director,
    posterUrl: posterPath ? `${IMG}${posterPath}` : "",
    status: "watchlist", visibilityRings: [1, 2, 3, 4], ...extras,
  };
}

function jasonMovies(sarahId) {
  return [
    movie(278, "The Shawshank Redemption", 1994, "Drama, Crime", "Frank Darabont", "/9cjIGRiQoJ9yLI48ME0YSn56Nti.jpg", 5, "2025-01-15", { snapshot1: "Hope is a good thing, maybe the best of things" }),
    movie(27205, "Inception", 2010, "Sci-Fi, Action", "Christopher Nolan", "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", 5, "2025-02-10", { snapshot1: "Still thinking about that spinning top", companions: [{ displayName: "Sarah", type: "contact" }] }),
    movie(496243, "Parasite", 2019, "Thriller, Drama", "Bong Joon-ho", "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", 4, "2025-03-05"),
    movie(155, "The Dark Knight", 2008, "Action, Crime", "Christopher Nolan", "/qJ2tW6WMUDux911BTUOrgT4GH7M.jpg", 5, "2025-01-20", { snapshot1: "Heath Ledger's performance is unmatched" }),
    movie(157336, "Interstellar", 2014, "Sci-Fi, Drama", "Christopher Nolan", "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", 5, "2025-04-12", { snapshot1: "The docking scene still gets my heart racing", companions: [{ displayName: "Sarah", type: "contact" }, { displayName: "Mike", type: "contact" }] }),
    movie(244786, "Whiplash", 2014, "Drama, Music", "Damien Chazelle", "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", 4, "2025-02-28"),
    movie(545611, "Everything Everywhere All at Once", 2022, "Sci-Fi, Action", "Daniel Kwan, Daniel Scheinert", "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", 5, "2025-03-20", { snapshot1: "Cried three separate times" }),
    movie(872585, "Oppenheimer", 2023, "Drama, History", "Christopher Nolan", "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", 5, "2025-01-05", { snapshot1: "The Trinity test sequence in IMAX was overwhelming" }),
    movie(438631, "Dune", 2021, "Sci-Fi, Adventure", "Denis Villeneuve", "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", 5, "2025-03-10"),
    movie(329865, "Arrival", 2016, "Sci-Fi, Drama", "Denis Villeneuve", "/x2FJsf1ElAgr63Y3LNxZq57Kn5n.jpg", 5, "2025-01-30", { snapshot1: "The reveal recontextualizes the entire film" }),
    movie(569094, "Spider-Man: Across the Spider-Verse", 2023, "Animation, Action", "Joaquim Dos Santos", "/8Vt6mWEReuy6Of61Lnj5Xj704m8.jpg", 5, "2025-06-01"),
    movie(76341, "Mad Max: Fury Road", 2015, "Action, Adventure", "George Miller", "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", 5, "2025-05-22"),
    movie(603692, "John Wick: Chapter 4", 2023, "Action, Thriller", "Chad Stahelski", "/vZloFAK7NmvMGKE7VKF5A6jfs6n.jpg", 4, "2025-06-15"),
    movie(120467, "The Grand Budapest Hotel", 2014, "Comedy, Drama", "Wes Anderson", "/eWDyYtBnQ9ZUymEWibZ9ie7WAYT.jpg", 4, "2025-08-03"),
    watchlist(915935, "Anatomy of a Fall", 2023, "Drama, Thriller", "Justine Triet", "/kQs6gmNorCIxbUmFZFmMODcxEYh.jpg"),
    watchlist(823464, "Godzilla x Kong", 2024, "Action, Sci-Fi", "Adam Wingard", "/z1p34vh7dEOnLDV4jC1kCZpBnmI.jpg"),
    watchlist(792307, "Poor Things", 2023, "Sci-Fi, Comedy", "Yorgos Lanthimos", "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg", { recommendedBy: [{ userId: sarahId, displayName: "Sarah", acceptedAt: "2025-05-20T10:00:00.000Z" }] }),
    watchlist(666277, "Past Lives", 2023, "Drama, Romance", "Celine Song", "/k3waqVXSnvCKWFEnaBMsXKMVLFS.jpg", { recommendedBy: [{ userId: sarahId, displayName: "Sarah", acceptedAt: "2025-05-22T10:00:00.000Z" }] }),
  ];
}

function sarahMovies() {
  return [
    movie(278, "The Shawshank Redemption", 1994, "Drama, Crime", "Frank Darabont", "/9cjIGRiQoJ9yLI48ME0YSn56Nti.jpg", 5, "2025-01-20"),
    movie(27205, "Inception", 2010, "Sci-Fi, Action", "Christopher Nolan", "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", 4, "2025-02-15"),
    movie(496243, "Parasite", 2019, "Thriller, Drama", "Bong Joon-ho", "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", 5, "2025-03-10", { snapshot1: "The basement reveal is cinema at its best", companions: [{ displayName: "Jason", type: "contact" }] }),
    movie(157336, "Interstellar", 2014, "Sci-Fi, Drama", "Christopher Nolan", "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", 5, "2025-04-18"),
    movie(244786, "Whiplash", 2014, "Drama, Music", "Damien Chazelle", "/7fn624j5lj3xTme2SgiLCeuedmO.jpg", 5, "2025-03-01", { snapshot1: "Not quite my tempo — chills every time" }),
    movie(545611, "Everything Everywhere All at Once", 2022, "Sci-Fi, Action", "Daniel Kwan, Daniel Scheinert", "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", 5, "2025-03-25"),
    movie(666277, "Past Lives", 2023, "Drama, Romance", "Celine Song", "/k3waqVXSnvCKWFEnaBMsXKMVLFS.jpg", 5, "2025-05-15", { snapshot1: "The ending bench scene broke me", snapshot2: "In-yun is such a beautiful concept" }),
    movie(391713, "Lady Bird", 2017, "Drama, Comedy", "Greta Gerwig", "/iySFtKLrWvVFdFAeMfyKDMXLMsP.jpg", 5, "2025-02-05"),
    movie(531428, "Portrait of a Lady on Fire", 2019, "Drama, Romance", "Céline Sciamma", "/2LquGwEhbg3soxSCs9VNyh5VJSg.jpg", 5, "2025-04-25", { snapshot1: "Every frame is a painting" }),
    movie(376867, "Moonlight", 2016, "Drama", "Barry Jenkins", "/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg", 5, "2025-05-30"),
    movie(792307, "Poor Things", 2023, "Sci-Fi, Comedy", "Yorgos Lanthimos", "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg", 5, "2025-09-20", { snapshot1: "Emma Stone is fearless in this" }),
    movie(346698, "Barbie", 2023, "Comedy, Fantasy", "Greta Gerwig", "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", 4, "2025-07-05"),
    movie(872585, "Oppenheimer", 2023, "Drama, History", "Christopher Nolan", "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", 4, "2025-01-10"),
    watchlist(76341, "Mad Max: Fury Road", 2015, "Action, Adventure", "George Miller", "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg"),
    watchlist(438631, "Dune", 2021, "Sci-Fi, Adventure", "Denis Villeneuve", "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", { recommendedBy: [{ displayName: "Jason" }] }),
  ];
}

function mikeMovies() {
  return [
    movie(278, "The Shawshank Redemption", 1994, "Drama, Crime", "Frank Darabort", "/9cjIGRiQoJ9yLI48ME0YSn56Nti.jpg", 4, "2025-01-25"),
    movie(27205, "Inception", 2010, "Sci-Fi, Action", "Christopher Nolan", "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", 5, "2025-02-20"),
    movie(155, "The Dark Knight", 2008, "Action, Crime", "Christopher Nolan", "/qJ2tW6WMUDux911BTUOrgT4GH7M.jpg", 5, "2025-01-28", { snapshot1: "Why so serious?", companions: [{ displayName: "Jason", type: "contact" }] }),
    movie(157336, "Interstellar", 2014, "Sci-Fi, Drama", "Christopher Nolan", "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", 4, "2025-04-22"),
    movie(76341, "Mad Max: Fury Road", 2015, "Action, Adventure", "George Miller", "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", 5, "2025-05-28", { snapshot1: "What a lovely day!" }),
    movie(603692, "John Wick: Chapter 4", 2023, "Action, Thriller", "Chad Stahelski", "/vZloFAK7NmvMGKE7VKF5A6jfs6n.jpg", 5, "2025-06-20"),
    movie(361743, "Top Gun: Maverick", 2022, "Action, Drama", "Joseph Kosinski", "/62HCnUTziyWQb9QFnkJTBXNcDmq.jpg", 4, "2025-02-18"),
    movie(94329, "The Raid", 2011, "Action, Thriller", "Gareth Evans", "/bSnMjtiOfMW7GFkiYbFMaJwcfVj.jpg", 5, "2025-04-10", { snapshot1: "Best fight choreography ever filmed" }),
    movie(273481, "Sicario", 2015, "Thriller, Crime", "Denis Villeneuve", "/sR0SpCrXamlIkYMdfz83sFn5g3B.jpg", 5, "2025-05-05"),
    movie(98, "Gladiator", 2000, "Action, Drama", "Ridley Scott", "/ty8TGRuvJLPUmAR1H1nRIsgCTYV.jpg", 5, "2025-06-01", { snapshot1: "Are you not entertained?" }),
    movie(6977, "No Country for Old Men", 2007, "Thriller, Crime", "Joel Coen, Ethan Coen", "/bj1v6YKF8yHqA489GFm6ZEbWnKI.jpg", 4, "2025-07-15"),
    movie(872585, "Oppenheimer", 2023, "Drama, History", "Christopher Nolan", "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", 5, "2025-01-12"),
    watchlist(666277, "Past Lives", 2023, "Drama, Romance", "Celine Song", "/k3waqVXSnvCKWFEnaBMsXKMVLFS.jpg"),
    watchlist(792307, "Poor Things", 2023, "Sci-Fi, Comedy", "Yorgos Lanthimos", "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg"),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS — Real concerts, sports, broadway, festivals
// ═══════════════════════════════════════════════════════════════════════════════

function jasonEvents() {
  return [
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-08-03", data: { eventType: "concert", title: "Radiohead — In Rainbows Anniversary", artist: "Radiohead", venue: "Red Rocks Amphitheatre", city: "Morrison", state: "Colorado", country: "United States", startDate: "2025-08-03", snapshot1: "Hearing Reckoner live under the stars was transcendent", snapshot2: "Thom's voice echoing off the red rocks", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-02-11", data: { eventType: "sports", title: "Super Bowl LVIII", venue: "Allegiant Stadium", city: "Las Vegas", state: "Nevada", country: "United States", startDate: "2025-02-11", snapshot1: "Usher's halftime show was incredible", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-10-05", data: { eventType: "festival", title: "Austin City Limits 2025", venue: "Zilker Park", city: "Austin", state: "Texas", country: "United States", startDate: "2025-10-05", snapshot1: "Three days of perfect weather and perfect music", snapshot2: "The Foo Fighters closing set was legendary", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-04-15", data: { eventType: "concert", title: "The Killers — Rebel Diamonds Tour", artist: "The Killers", venue: "Madison Square Garden", city: "New York", state: "New York", country: "United States", startDate: "2025-04-15", snapshot1: "Mr. Brightside with 20,000 people singing along", rating: 4 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-06-20", data: { eventType: "sports", title: "NBA Finals Game 5", venue: "Chase Center", city: "San Francisco", state: "California", country: "United States", startDate: "2025-06-20", snapshot1: "Buzzer beater to win the series — I lost my voice", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-03-08", data: { eventType: "comedy", title: "John Mulaney — Everybody's in LA", artist: "John Mulaney", venue: "The Forum", city: "Los Angeles", state: "California", country: "United States", startDate: "2025-03-08", snapshot1: "Laughed so hard I cried during the subway bit", rating: 4 } },
    { id: crypto.randomUUID(), category: "events", status: "wishlist", data: { eventType: "concert", title: "Oasis — Reunion Tour 2025", artist: "Oasis", venue: "Wembley Stadium", city: "London", country: "United Kingdom" } },
    { id: crypto.randomUUID(), category: "events", status: "wishlist", data: { eventType: "broadway", title: "Wicked (Movie Cast Broadway)", venue: "Gershwin Theatre", city: "New York", state: "New York", country: "United States" } },
  ];
}

function sarahEvents() {
  return [
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-08-09", data: { eventType: "concert", title: "Taylor Swift — Eras Tour", artist: "Taylor Swift", venue: "SoFi Stadium", city: "Los Angeles", state: "California", country: "United States", startDate: "2025-08-09", snapshot1: "The friendship bracelets were everywhere — pure magic", snapshot2: "Cruel Summer live gave me actual chills", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-03-22", data: { eventType: "broadway", title: "Hamilton on Broadway", artist: "Lin-Manuel Miranda", venue: "Richard Rodgers Theatre", city: "New York", state: "New York", country: "United States", startDate: "2025-03-22", snapshot1: "The Room Where It Happens brought the house down", snapshot2: "Best birthday present ever", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-01-18", data: { eventType: "concert", title: "Adele — Weekends with Adele", artist: "Adele", venue: "The Colosseum at Caesars Palace", city: "Las Vegas", state: "Nevada", country: "United States", startDate: "2025-01-18", snapshot1: "She sang Someone Like You and the entire crowd was in tears", snapshot2: "Intimate venue — felt like a living room concert", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-06-14", data: { eventType: "concert", title: "Coldplay — Music of the Spheres", artist: "Coldplay", venue: "MetLife Stadium", city: "East Rutherford", state: "New Jersey", country: "United States", startDate: "2025-06-14", snapshot1: "The LED wristbands syncing to Fix You was incredible", rating: 4 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-04-13", data: { eventType: "sports", title: "UFC 300", venue: "T-Mobile Arena", city: "Las Vegas", state: "Nevada", country: "United States", startDate: "2025-04-13", snapshot1: "Alex Pereira's knockout was the craziest thing I've ever seen live", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-09-28", data: { eventType: "broadway", title: "Wicked on Broadway", venue: "Gershwin Theatre", city: "New York", state: "New York", country: "United States", startDate: "2025-09-28", snapshot1: "Defying Gravity gives me goosebumps every single time", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "wishlist", data: { eventType: "festival", title: "Coachella 2026", venue: "Empire Polo Club", city: "Indio", state: "California", country: "United States" } },
    { id: crypto.randomUUID(), category: "events", status: "wishlist", data: { eventType: "concert", title: "Beyoncé — Renaissance World Tour", artist: "Beyoncé", venue: "TBD", city: "Houston", state: "Texas", country: "United States" } },
  ];
}

function mikeEvents() {
  return [
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-02-11", data: { eventType: "sports", title: "Super Bowl LVIII", venue: "Allegiant Stadium", city: "Las Vegas", state: "Nevada", country: "United States", startDate: "2025-02-11", snapshot1: "The atmosphere was electric from kickoff", snapshot2: "Best sporting event I've ever attended", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-07-04", data: { eventType: "concert", title: "Metallica — M72 World Tour", artist: "Metallica", venue: "AT&T Stadium", city: "Arlington", state: "Texas", country: "United States", startDate: "2025-07-04", snapshot1: "Enter Sandman on July 4th with fireworks — unreal", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-04-13", data: { eventType: "sports", title: "UFC 300", venue: "T-Mobile Arena", city: "Las Vegas", state: "Nevada", country: "United States", startDate: "2025-04-13", snapshot1: "Best card in UFC history, no question", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-11-01", data: { eventType: "sports", title: "Formula 1 — US Grand Prix", venue: "Circuit of the Americas", city: "Austin", state: "Texas", country: "United States", startDate: "2025-11-01", snapshot1: "The sound of those engines in person is indescribable", rating: 4 } },
    { id: crypto.randomUUID(), category: "events", status: "attended", start_date: "2025-05-17", data: { eventType: "concert", title: "Tool — Fear Inoculum Tour", artist: "Tool", venue: "The Gorge Amphitheatre", city: "George", state: "Washington", country: "United States", startDate: "2025-05-17", snapshot1: "The visuals paired with Pneuma were otherworldly", rating: 5 } },
    { id: crypto.randomUUID(), category: "events", status: "wishlist", data: { eventType: "sports", title: "World Cup 2026 Final", venue: "MetLife Stadium", city: "East Rutherford", state: "New Jersey", country: "United States" } },
    { id: crypto.randomUUID(), category: "events", status: "wishlist", data: { eventType: "concert", title: "Oasis — Reunion Tour 2025", artist: "Oasis", venue: "Wembley Stadium", city: "London", country: "United Kingdom" } },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAVEL — Real destinations
// ═══════════════════════════════════════════════════════════════════════════════

function jasonTravel() {
  return [
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-06-10", data: { title: "Barcelona & Costa Brava", city: "Barcelona", country: "Spain", startDate: "2025-06-10", endDate: "2025-06-18", snapshot1: "La Sagrada Familia took my breath away — Gaudi was a genius", snapshot2: "Swimming in hidden coves along the Costa Brava", travelTips: "Book Sagrada Familia tickets 2 months early. Rent a car for Costa Brava day trips.", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-03-15", data: { title: "Tokyo & Kyoto", city: "Tokyo", country: "Japan", startDate: "2025-03-15", endDate: "2025-03-25", snapshot1: "Cherry blossoms in Shinjuku Gyoen — timing was perfect", snapshot2: "The Fushimi Inari gates at sunrise with no one around", snapshot3: "Ramen in Golden Gai at 2am", travelTips: "Get a 7-day JR pass. Stay in Shinjuku for access.", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2024-12-20", data: { title: "Iceland Ring Road", city: "Reykjavik", country: "Iceland", startDate: "2024-12-20", endDate: "2024-12-30", snapshot1: "Northern lights dancing over the glacier lagoon", snapshot2: "Driving through whiteout snowstorms was terrifying and beautiful", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-09-01", data: { title: "Amalfi Coast Road Trip", city: "Positano", country: "Italy", startDate: "2025-09-01", endDate: "2025-09-08", snapshot1: "Limoncello on the terrace overlooking the sea at sunset", travelTips: "Drive the coast early morning — no traffic, no buses.", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-01-05", data: { title: "Skiing in Chamonix", city: "Chamonix", country: "France", startDate: "2025-01-05", endDate: "2025-01-12", snapshot1: "The Vallée Blanche descent was a once-in-a-lifetime run", rating: 4 } },
    { id: crypto.randomUUID(), category: "travel", status: "wishlist", data: { title: "Patagonia Trekking", city: "El Chaltén", country: "Argentina", wishlistReason: "W Trek + Fitz Roy — the ultimate hiking trip" } },
    { id: crypto.randomUUID(), category: "travel", status: "wishlist", data: { title: "New Zealand South Island", city: "Queenstown", country: "New Zealand", wishlistReason: "Milford Sound, glaciers, LOTR locations" } },
  ];
}

function sarahTravel() {
  return [
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-05-20", data: { title: "Paris in Spring", city: "Paris", country: "France", startDate: "2025-05-20", endDate: "2025-05-27", snapshot1: "Picnic under the Eiffel Tower at golden hour", snapshot2: "The Musée d'Orsay impressionist collection left me speechless", snapshot3: "Croissants from Du Pain et des Idées every morning", travelTips: "Stay in Le Marais. Museum pass is worth it.", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-08-15", data: { title: "Santorini & Athens", city: "Santorini", country: "Greece", startDate: "2025-08-15", endDate: "2025-08-23", snapshot1: "Watching the sunset from Oia was everything I imagined", snapshot2: "Swimming in the caldera — surreal blue water", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-02-14", data: { title: "Tulum & Cenotes", city: "Tulum", country: "Mexico", startDate: "2025-02-14", endDate: "2025-02-20", snapshot1: "Swimming in Gran Cenote was magical — the light beams through the cave", travelTips: "Rent bikes. Go to cenotes at 8am to beat crowds.", rating: 4 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-10-10", data: { title: "Morocco — Marrakech to Sahara", city: "Marrakech", country: "Morocco", startDate: "2025-10-10", endDate: "2025-10-18", snapshot1: "Sleeping under the stars in the Sahara desert", snapshot2: "The colors and chaos of Jemaa el-Fnaa at night", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "wishlist", data: { title: "Bali & Ubud", city: "Ubud", country: "Indonesia", wishlistReason: "Rice terraces, temples, yoga retreats" } },
    { id: crypto.randomUUID(), category: "travel", status: "wishlist", data: { title: "Northern Japan in Autumn", city: "Nikko", country: "Japan", wishlistReason: "Fall foliage at temples, onsen culture" } },
  ];
}

function mikeTravel() {
  return [
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-04-01", data: { title: "Patagonia — Torres del Paine", city: "El Chaltén", country: "Argentina", startDate: "2025-04-01", endDate: "2025-04-12", snapshot1: "Seeing Fitz Roy emerge from the clouds after 3 days of rain", snapshot2: "The W Trek is the hardest and best thing I've ever done", snapshot3: "Mate with gauchos at a remote estancia", travelTips: "Book refugios 6 months ahead. Layers are everything.", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-07-20", data: { title: "Swiss Alps — Zermatt & Grindelwald", city: "Zermatt", country: "Switzerland", startDate: "2025-07-20", endDate: "2025-07-28", snapshot1: "The Matterhorn at sunrise from Gornergrat — worth the 5am alarm", snapshot2: "Paragliding over Interlaken was pure freedom", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-01-15", data: { title: "Costa Rica Adventure", city: "La Fortuna", country: "Costa Rica", startDate: "2025-01-15", endDate: "2025-01-22", snapshot1: "Zip-lining through the cloud forest canopy", travelTips: "4x4 essential. Dry season (Jan-Apr) is best.", rating: 4 } },
    { id: crypto.randomUUID(), category: "travel", status: "visited", start_date: "2025-11-05", data: { title: "Vietnam — Hanoi to Ho Chi Minh", city: "Hanoi", country: "Vietnam", startDate: "2025-11-05", endDate: "2025-11-16", snapshot1: "Motorbike through Ha Giang Loop — most scenic ride of my life", rating: 5 } },
    { id: crypto.randomUUID(), category: "travel", status: "wishlist", data: { title: "Nepal — Everest Base Camp", city: "Lukla", country: "Nepal", wishlistReason: "The ultimate trek — 12 days to the roof of the world" } },
    { id: crypto.randomUUID(), category: "travel", status: "wishlist", data: { title: "Iceland Ring Road", city: "Reykjavik", country: "Iceland", wishlistReason: "Glaciers, volcanoes, northern lights, hot springs" } },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES — Real outdoor/adventure
// ═══════════════════════════════════════════════════════════════════════════════

function jasonActivities() {
  return [
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-01-08", data: { title: "Skiing — Vail Back Bowls", activityType: "skiing", city: "Vail", state: "Colorado", country: "United States", difficulty: "advanced", startDate: "2025-01-08", snapshot1: "Fresh powder day in the back bowls — knee deep", snapshot2: "Blue Bird Express to Game Creek — empty runs all morning", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-07-15", data: { title: "Surfing in Maui", activityType: "surfing", city: "Maui", state: "Hawaii", country: "United States", difficulty: "intermediate", startDate: "2025-07-15", snapshot1: "Finally caught a clean wave at Ho'okipa", snapshot2: "Sea turtles surfacing next to me in the lineup", rating: 4 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-05-20", data: { title: "Mountain Biking — Moab", activityType: "mountain biking", city: "Moab", state: "Utah", country: "United States", difficulty: "advanced", startDate: "2025-05-20", snapshot1: "Whole Enchilada trail — 26 miles of pure flow", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-09-10", data: { title: "Rock Climbing — Red River Gorge", activityType: "rock climbing", city: "Slade", state: "Kentucky", country: "United States", difficulty: "intermediate", startDate: "2025-09-10", snapshot1: "Sent my first 5.11a outdoor route", rating: 4 } },
    { id: crypto.randomUUID(), category: "activities", status: "wishlist", data: { title: "Heli-Skiing in Alaska", activityType: "skiing", city: "Valdez", state: "Alaska", country: "United States", difficulty: "expert", wishlistReason: "Bucket list — steep spines and endless powder" } },
    { id: crypto.randomUUID(), category: "activities", status: "wishlist", data: { title: "Scuba — Great Barrier Reef", activityType: "scuba diving", city: "Cairns", country: "Australia", difficulty: "intermediate", wishlistReason: "Before it's gone" } },
  ];
}

function sarahActivities() {
  return [
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-03-10", data: { title: "Hiking — Angels Landing", activityType: "hiking", city: "Springdale", state: "Utah", country: "United States", difficulty: "advanced", startDate: "2025-03-10", snapshot1: "The chain section with 1000ft drops on each side — terrifying and exhilarating", snapshot2: "The view from the top was worth every second of fear", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-06-22", data: { title: "Kayaking — Na Pali Coast", activityType: "kayaking", city: "Kauai", state: "Hawaii", country: "United States", difficulty: "intermediate", startDate: "2025-06-22", snapshot1: "Paddling into sea caves with waterfalls overhead", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-01-20", data: { title: "Skiing — Park City", activityType: "skiing", city: "Park City", state: "Utah", country: "United States", difficulty: "intermediate", startDate: "2025-01-20", snapshot1: "Perfect groomers all day — best ski conditions of the season", rating: 4 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-08-05", data: { title: "Snorkeling — Cenote Dos Ojos", activityType: "snorkeling", city: "Tulum", country: "Mexico", difficulty: "beginner", startDate: "2025-08-05", snapshot1: "Crystal clear water with light beams piercing through", rating: 4 } },
    { id: crypto.randomUUID(), category: "activities", status: "wishlist", data: { title: "Trekking — Inca Trail to Machu Picchu", activityType: "hiking", city: "Cusco", country: "Peru", difficulty: "advanced", wishlistReason: "4 day trek through cloud forests to the Sun Gate" } },
  ];
}

function mikeActivities() {
  return [
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-02-05", data: { title: "Skiing — Jackson Hole", activityType: "skiing", city: "Jackson", state: "Wyoming", country: "United States", difficulty: "expert", startDate: "2025-02-05", snapshot1: "Corbet's Couloir — stared at it for 10 minutes then dropped in", snapshot2: "Most intense 4 seconds of my life followed by the best run ever", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-04-05", data: { title: "Trekking — Torres del Paine W Trek", activityType: "hiking", city: "El Chaltén", country: "Argentina", difficulty: "advanced", startDate: "2025-04-05", snapshot1: "5 days, 50 miles, zero regrets", snapshot2: "Glacier Grey calving right in front of us", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-06-30", data: { title: "Paragliding — Interlaken", activityType: "paragliding", city: "Interlaken", country: "Switzerland", difficulty: "beginner", startDate: "2025-06-30", snapshot1: "15 minutes of pure silence floating above the Alps", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-08-20", data: { title: "Scuba Diving — Belize Blue Hole", activityType: "scuba diving", city: "Belize City", country: "Belize", difficulty: "advanced", startDate: "2025-08-20", snapshot1: "130ft down into the abyss — reef sharks circling overhead", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "done", start_date: "2025-10-15", data: { title: "Mountain Biking — Whistler", activityType: "mountain biking", city: "Whistler", state: "British Columbia", country: "Canada", difficulty: "advanced", startDate: "2025-10-15", snapshot1: "A-Line is the best flow trail on earth", rating: 5 } },
    { id: crypto.randomUUID(), category: "activities", status: "wishlist", data: { title: "Wingsuit Flying", activityType: "skydiving", city: "Lauterbrunnen", country: "Switzerland", difficulty: "expert", wishlistReason: "The ultimate adrenaline rush — need 200+ skydives first" } },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CELLAR — Wines + Whiskeys
// ═══════════════════════════════════════════════════════════════════════════════

function jasonCellar() {
  return [
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-03-15", data: { subType: "wine", wineName: "Opus One 2019", winery: "Opus One", vintage: "2019", wineType: "Red", varietal: "Cabernet Sauvignon", region: "Napa Valley", country: "US", city: "Napa", state: "California", occasion: "Special Occasion", rating: 5, snapshot1: "Smooth as silk — best cab I've ever had", snapshot2: "Anniversary dinner splurge that was worth every penny", pricePerBottle: 400 } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-06-20", data: { subType: "wine", wineName: "Château Margaux 2015", winery: "Château Margaux", vintage: "2015", wineType: "Red", varietal: "Blend", region: "Bordeaux", country: "FR", city: "Florence", state: "Tuscany", occasion: "Restaurant", rating: 5, snapshot1: "Opened at a restaurant in Florence — life-changing moment", pricePerBottle: 650 } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-01-28", data: { subType: "whiskey", whiskyName: "Lagavulin 16", distillery: "Lagavulin", whiskyType: "Scotch", ageStatement: "16 Year", abv: "43.0", region: "Islay", country: "GB", nose: "Peat smoke, sea salt, dried fruit", palate: "Rich smoky sweetness, brine, dark chocolate", finish: "Long, warming, lingering campfire smoke", rating: 5, snapshot1: "Ron Swanson was right — this is the drink", occasion: "Everyday" } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-05-10", data: { subType: "whiskey", whiskyName: "Blanton's Single Barrel", distillery: "Buffalo Trace", whiskyType: "Bourbon", ageStatement: "NAS", abv: "46.5", caskType: "Ex-Bourbon", region: "Kentucky", country: "US", nose: "Caramel, vanilla, orange peel", palate: "Brown sugar, baking spices, toasted oak", finish: "Medium, honey and light pepper", rating: 4, snapshot1: "Finally found a bottle — lived up to the hype", occasion: "Tasting" } },
    { id: crypto.randomUUID(), category: "cellar", status: "cellar", data: { subType: "wine", wineName: "Caymus Special Selection 2018", winery: "Caymus Vineyards", vintage: "2018", wineType: "Red", varietal: "Cabernet Sauvignon", region: "Napa Valley", country: "US", bottleCount: 3, purchasePrice: 185, purchaseLocation: "Total Wine", drinkAfter: "2026-01-01", drinkBy: "2035-12-31", storageLocation: "Home Cellar", purchaseOccasion: "Bought a case after the tasting room visit" } },
    { id: crypto.randomUUID(), category: "cellar", status: "cellar", data: { subType: "whiskey", whiskyName: "Yamazaki 18", distillery: "Suntory Yamazaki", whiskyType: "Japanese", ageStatement: "18 Year", abv: "43.0", region: "Osaka", country: "JP", bottleCount: 1, purchasePrice: 450, purchaseLocation: "Duty Free — Narita Airport", storageLocation: "Home Cellar", purchaseOccasion: "Grabbed it at Narita during the Tokyo trip — can't find it stateside" } },
    { id: crypto.randomUUID(), category: "cellar", status: "wishlist", data: { subType: "wine", wineName: "Screaming Eagle Cabernet 2020", winery: "Screaming Eagle", vintage: "2020", wineType: "Red", varietal: "Cabernet Sauvignon", region: "Napa Valley", country: "US", wishlistReason: "Grail wine — need to get on the mailing list", pricePerBottle: 3500 } },
    { id: crypto.randomUUID(), category: "cellar", status: "wishlist", data: { subType: "whiskey", whiskyName: "Pappy Van Winkle 15 Year", distillery: "Old Rip Van Winkle", whiskyType: "Bourbon", ageStatement: "15 Year", region: "Kentucky", country: "US", wishlistReason: "Unicorn bottle — enter every lottery I can find" } },
  ];
}

function sarahCellar() {
  return [
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-05-22", data: { subType: "wine", wineName: "Whispering Angel Rosé 2023", winery: "Château d'Esclans", vintage: "2023", wineType: "Rosé", varietal: "Grenache", region: "Provence", country: "FR", city: "Paris", occasion: "Restaurant", rating: 4, snapshot1: "Perfect summer wine — drinking this on a Paris rooftop was everything", pricePerBottle: 22 } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-09-15", data: { subType: "wine", wineName: "Cloudy Bay Sauvignon Blanc 2022", winery: "Cloudy Bay", vintage: "2022", wineType: "White", varietal: "Sauvignon Blanc", region: "Marlborough", country: "NZ", occasion: "Dinner Party", rating: 4, snapshot1: "Crisp, tropical, perfect with seafood", pricePerBottle: 28 } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-02-14", data: { subType: "wine", wineName: "Veuve Clicquot Yellow Label", winery: "Veuve Clicquot", vintage: "NV", wineType: "Sparkling", varietal: "Blend", region: "Champagne", country: "FR", city: "Tulum", occasion: "Special Occasion", rating: 5, snapshot1: "Valentine's Day champagne on the beach at sunset", pricePerBottle: 55 } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-07-04", data: { subType: "wine", wineName: "Duckhorn Merlot 2020", winery: "Duckhorn Vineyards", vintage: "2020", wineType: "Red", varietal: "Merlot", region: "Napa Valley", country: "US", occasion: "Dinner Party", rating: 4, snapshot1: "Velvety and rich — everyone at dinner loved it", pricePerBottle: 58 } },
    { id: crypto.randomUUID(), category: "cellar", status: "cellar", data: { subType: "wine", wineName: "Dom Pérignon 2012", winery: "Dom Pérignon", vintage: "2012", wineType: "Sparkling", varietal: "Blend", region: "Champagne", country: "FR", bottleCount: 2, purchasePrice: 220, purchaseLocation: "Wine.com", storageLocation: "Wine Fridge", purchaseOccasion: "Saving for a big celebration" } },
    { id: crypto.randomUUID(), category: "cellar", status: "wishlist", data: { subType: "wine", wineName: "Sassicaia 2019", winery: "Tenuta San Guido", vintage: "2019", wineType: "Red", varietal: "Cabernet Sauvignon", region: "Tuscany", country: "IT", wishlistReason: "The Super Tuscan that started it all" } },
  ];
}

function mikeCellar() {
  return [
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-03-01", data: { subType: "whiskey", whiskyName: "Ardbeg Uigeadail", distillery: "Ardbeg", whiskyType: "Scotch", ageStatement: "NAS", abv: "54.2", caskType: "Ex-Bourbon + Sherry Butt", region: "Islay", country: "GB", nose: "Intense peat, dark fruits, espresso", palate: "Smoke, Christmas cake, treacle, dried figs", finish: "Incredibly long, smoky-sweet, lingering", rating: 5, snapshot1: "This replaced Lagavulin as my #1 — the sherry cask influence is unreal", occasion: "Tasting" } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-06-15", data: { subType: "whiskey", whiskyName: "Hibiki Harmony", distillery: "Suntory", whiskyType: "Japanese", ageStatement: "NAS", abv: "43.0", region: "Japan", country: "JP", nose: "Rose, lychee, light honey", palate: "Gentle orange peel, white chocolate, sandalwood", finish: "Subtle, clean, delicate", rating: 4, snapshot1: "Incredibly smooth and refined — like drinking silk", occasion: "Gift" } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-08-22", data: { subType: "whiskey", whiskyName: "Eagle Rare 10", distillery: "Buffalo Trace", whiskyType: "Bourbon", ageStatement: "10 Year", abv: "45.0", region: "Kentucky", country: "US", nose: "Toffee, orange zest, oak", palate: "Rich caramel, vanilla, honey, leather", finish: "Medium-long, warm cinnamon", rating: 4, snapshot1: "Best bourbon under $40 — period", occasion: "Everyday" } },
    { id: crypto.randomUUID(), category: "cellar", status: "tried", start_date: "2025-04-10", data: { subType: "wine", wineName: "The Prisoner Red Blend 2021", winery: "The Prisoner Wine Company", vintage: "2021", wineType: "Red", varietal: "Blend", region: "Napa Valley", country: "US", occasion: "Dinner Party", rating: 4, snapshot1: "Dark fruit bomb — people always ask what this is", pricePerBottle: 48 } },
    { id: crypto.randomUUID(), category: "cellar", status: "cellar", data: { subType: "whiskey", whiskyName: "GlenDronach 21 Parliament", distillery: "GlenDronach", whiskyType: "Scotch", ageStatement: "21 Year", abv: "48.0", caskType: "Sherry Butt", region: "Highland", country: "GB", bottleCount: 1, purchasePrice: 280, purchaseLocation: "Total Wine", storageLocation: "Home Cellar", purchaseOccasion: "Last bottle on the shelf — had to grab it" } },
    { id: crypto.randomUUID(), category: "cellar", status: "wishlist", data: { subType: "whiskey", whiskyName: "Macallan 25 Sherry Oak", distillery: "The Macallan", whiskyType: "Scotch", ageStatement: "25 Year", region: "Speyside", country: "GB", wishlistReason: "The holy grail of sherry-matured scotch" } },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARS — Owned and wishlist vehicles
// ═══════════════════════════════════════════════════════════════════════════════

function jasonCars() {
  return [
    { id: crypto.randomUUID(), category: "cars", status: "owned", start_date: "2022-03-15", data: { make: "Tesla", model: "Model 3", year: "2022", trim: "Long Range", bodyClass: "Sedan", fuelType: "Electric", driveType: "All-Wheel Drive", transmission: "Automatic", doors: 4, startDate: "2022-03-15", purchasePrice: 52000, snapshot1: "The instant torque never gets old", snapshot2: "Road trip to Big Sur — 0 gas stops", rating: 5, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "cars", status: "owned", start_date: "2018-06-01", data: { make: "Toyota", model: "4Runner", year: "2018", trim: "TRD Off-Road", bodyClass: "SUV", fuelType: "Gasoline", engineCylinders: 6, displacement: "4.0", driveType: "Four-Wheel Drive", transmission: "Automatic", doors: 4, startDate: "2018-06-01", endDate: "2022-02-28", purchasePrice: 38000, soldPrice: 35000, snapshot1: "Took this beast everywhere — Moab, Big Bend, every ski trip", snapshot2: "Sold it when I got the Tesla but still miss it sometimes", rating: 5, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "cars", status: "wishlist", data: { make: "Porsche", model: "911", year: "2025", trim: "Carrera S", bodyClass: "Coupe", fuelType: "Gasoline", engineCylinders: 6, driveType: "Rear-Wheel Drive" } },
  ];
}

function sarahCars() {
  return [
    { id: crypto.randomUUID(), category: "cars", status: "owned", start_date: "2023-09-10", data: { make: "BMW", model: "X3", year: "2023", trim: "xDrive30i", bodyClass: "SUV", fuelType: "Gasoline", engineCylinders: 4, displacement: "2.0", driveType: "All-Wheel Drive", transmission: "Automatic", doors: 4, startDate: "2023-09-10", purchasePrice: 48000, snapshot1: "Perfect size — nimble enough for the city, big enough for road trips", rating: 4, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "cars", status: "owned", start_date: "2019-01-15", data: { make: "Volkswagen", model: "Golf GTI", year: "2019", trim: "SE", bodyClass: "Hatchback", fuelType: "Gasoline", engineCylinders: 4, displacement: "2.0", driveType: "Front-Wheel Drive", transmission: "Manual", doors: 4, startDate: "2019-01-15", endDate: "2023-08-30", purchasePrice: 29000, soldPrice: 22000, snapshot1: "So much fun to drive — that turbo kick in 2nd gear", snapshot2: "Only car I've had with a manual — miss the engagement", rating: 5, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "cars", status: "wishlist", data: { make: "Mercedes-Benz", model: "EQS SUV", year: "2025", trim: "450+", bodyClass: "SUV", fuelType: "Electric", driveType: "All-Wheel Drive" } },
  ];
}

function mikeCars() {
  return [
    { id: crypto.randomUUID(), category: "cars", status: "owned", start_date: "2021-11-20", data: { make: "Ford", model: "Bronco", year: "2021", trim: "Badlands", bodyClass: "SUV", fuelType: "Gasoline", engineCylinders: 4, displacement: "2.7", driveType: "Four-Wheel Drive", transmission: "Automatic", doors: 4, startDate: "2021-11-20", purchasePrice: 45000, snapshot1: "This thing eats trails for breakfast — Rubicon, Moab, you name it", snapshot2: "Doors off, top off, music up — summer perfection", rating: 5, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "cars", status: "owned", start_date: "2024-05-01", data: { make: "Rivian", model: "R1T", year: "2024", trim: "Adventure", bodyClass: "Pickup Truck", fuelType: "Electric", driveType: "All-Wheel Drive", transmission: "Automatic", doors: 4, startDate: "2024-05-01", purchasePrice: 73000, snapshot1: "Camp mode + gear tunnel = the ultimate adventure vehicle", snapshot2: "Towed my bikes to Whistler — 300 mile range with a trailer", rating: 5, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "cars", status: "wishlist", data: { make: "Land Rover", model: "Defender", year: "2025", trim: "V8", bodyClass: "SUV", fuelType: "Gasoline", engineCylinders: 8, driveType: "All-Wheel Drive" } },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOMES — Owned, rented, wishlist
// ═══════════════════════════════════════════════════════════════════════════════

function jasonHomes() {
  return [
    { id: crypto.randomUUID(), category: "homes", status: "owned", data: { type: "House", address: "742 Evergreen Terrace", city: "Austin", state: "Texas", country: "United States", sqft: 2400, bedrooms: 4, bathrooms: 3, yearsLived: 3, purchaseDate: "2022-06-15", purchasePrice: 520000, snapshot1: "First house — the backyard sold me instantly", snapshot2: "Renovated the kitchen last year and it's now my favorite room", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "homes", status: "rented", data: { type: "Apartment", address: "1200 Main St Apt 4B", city: "Denver", state: "Colorado", country: "United States", sqft: 900, bedrooms: 1, bathrooms: 1, yearsLived: 2, monthlyRent: 1800, startDate: "2020-03-01", snapshot1: "Tiny but the rooftop views of the Rockies made up for it", snapshot2: "Walking distance to everything — miss that convenience", rating: 4, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "homes", status: "rented", data: { type: "Apartment", address: "450 W 34th St Apt 12C", city: "New York", state: "New York", country: "United States", sqft: 650, bedrooms: 1, bathrooms: 1, yearsLived: 3, monthlyRent: 2800, startDate: "2017-08-01", snapshot1: "NYC studio life — learned to cook in a kitchen smaller than a closet", rating: 3, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "homes", status: "wishlist", data: { type: "House", city: "Park City", state: "Utah", country: "United States", sqft: 3200, bedrooms: 4, bathrooms: 4 } },
  ];
}

function sarahHomes() {
  return [
    { id: crypto.randomUUID(), category: "homes", status: "owned", data: { type: "Condo", address: "88 Congress Ave Unit 1502", city: "Austin", state: "Texas", country: "United States", sqft: 1600, bedrooms: 2, bathrooms: 2, yearsLived: 2, purchaseDate: "2023-11-01", purchasePrice: 425000, snapshot1: "Downtown views + walking distance to everything I need", snapshot2: "The rooftop pool is my happy place", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "homes", status: "rented", data: { type: "Apartment", address: "2200 Westlake Dr Apt 7A", city: "Austin", state: "Texas", country: "United States", sqft: 1100, bedrooms: 2, bathrooms: 2, yearsLived: 3, monthlyRent: 2200, startDate: "2020-08-01", snapshot1: "Lake Austin views from the balcony — watched sunsets every night", rating: 4, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "homes", status: "wishlist", data: { type: "House", city: "Amalfi", country: "Italy", bedrooms: 3, bathrooms: 2 } },
  ];
}

function mikeHomes() {
  return [
    { id: crypto.randomUUID(), category: "homes", status: "rented", data: { type: "House", address: "1847 Barton Springs Rd", city: "Austin", state: "Texas", country: "United States", sqft: 1800, bedrooms: 3, bathrooms: 2, yearsLived: 2, monthlyRent: 2600, startDate: "2023-04-01", snapshot1: "The garage finally fits all my gear — bikes, boards, skis", snapshot2: "Barton Springs is a 5 minute walk", rating: 4, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "homes", status: "rented", data: { type: "Apartment", address: "600 Rainey St Apt 2204", city: "Austin", state: "Texas", country: "United States", sqft: 1000, bedrooms: 1, bathrooms: 1, yearsLived: 2, monthlyRent: 2100, startDate: "2021-02-01", snapshot1: "Rainey Street at your doorstep — great for your 20s, terrible for sleep", rating: 3, visibilityRings: [1, 2, 3, 4] } },
    { id: crypto.randomUUID(), category: "homes", status: "wishlist", data: { type: "House", city: "Whitefish", state: "Montana", country: "United States", sqft: 2800, bedrooms: 3, bathrooms: 3 } },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// KIDS — Milestones (Jason + Sarah only — Mike has no kids in the seed)
// ═══════════════════════════════════════════════════════════════════════════════

function jasonKids(childContactId) {
  return [
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-05-23", data: { milestoneType: "school", title: "Last Day of 3rd Grade", childContactId, schoolName: "Barton Hills Elementary", grade: "3rd Grade", schoolEvent: "Last Day", startDate: "2025-05-23", snapshot1: "He ran out screaming 'FREEDOM' — couldn't stop laughing", snapshot2: "Already taller than half the 4th graders", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-03-15", data: { milestoneType: "sports", title: "First Soccer Goal", childContactId, sport: "Soccer", teamName: "Austin Wildcats", season: "Spring 2025", position: "Forward", sportsEvent: "Game", result: "Won 4-2 — scored the opener", startDate: "2025-03-15", snapshot1: "The look on his face when it went in — pure joy", snapshot2: "Whole team dogpiled him", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-01-18", data: { milestoneType: "firsts", title: "First Time Skiing Alone", childContactId, firstWhat: "First time skiing a blue run without help", significance: "Big deal", startDate: "2025-01-18", locationName: "Vail Mountain", snapshot1: "Watched him carve down the whole run by himself — proud dad moment", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-04-12", data: { milestoneType: "performance", title: "Spring Piano Recital", childContactId, performanceType: "Music", performanceName: "Spring Recital 2025", role: "Piano — Für Elise", startDate: "2025-04-12", locationName: "School Auditorium", snapshot1: "Nailed it without a single mistake — months of practice paid off", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-09-01", data: { milestoneType: "school", title: "First Day of 4th Grade", childContactId, schoolName: "Barton Hills Elementary", grade: "4th Grade", schoolEvent: "First Day", startDate: "2025-09-01", snapshot1: "New backpack, nervous smile, grew 2 inches over summer", visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "upcoming", data: { milestoneType: "sports", title: "Fall Soccer Tournament", childContactId, sport: "Soccer", teamName: "Austin Wildcats", season: "Fall 2025", sportsEvent: "Tournament", startDate: "2025-11-15", locationName: "Round Rock Multiplex" } },
  ];
}

function sarahKids(childContactId) {
  return [
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-06-01", data: { milestoneType: "achievement", title: "Honor Roll — Spring 2025", childContactId, achievementType: "Academic", achievementName: "Honor Roll", startDate: "2025-06-01", snapshot1: "Straight A's all year — so proud of her dedication", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-04-20", data: { milestoneType: "performance", title: "Dance Recital — The Nutcracker", childContactId, performanceType: "Dance", performanceName: "Spring Dance Showcase", role: "Clara", startDate: "2025-04-20", locationName: "Long Center for the Arts", snapshot1: "She was Clara! Opening night nerves but she absolutely shone", snapshot2: "Standing ovation — I was a mess", rating: 5, visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "happened", start_date: "2025-02-10", data: { milestoneType: "firsts", title: "First Sleepover", childContactId, firstWhat: "First sleepover at a friend's house", significance: "Everyday win", startDate: "2025-02-10", snapshot1: "She was so brave — only one FaceTime call at bedtime", visibilityRings: [1, 2] } },
    { id: crypto.randomUUID(), category: "kids", status: "upcoming", data: { milestoneType: "school", title: "5th Grade Graduation", childContactId, schoolName: "Zilker Elementary", grade: "5th Grade", schoolEvent: "Graduation", startDate: "2026-06-05" } },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Seed everything + social features
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n\x1b[1m🌱 Seeding Realistic Data\x1b[0m\n");

  const { client: jasonClient, userId: jasonId } = await getAuthClient(USERS.jason);
  const { client: sarahClient, userId: sarahId } = await getAuthClient(USERS.sarah);
  const { client: mikeClient, userId: mikeId } = await getAuthClient(USERS.mike);
  console.log(`  Jason: ${jasonId}\n  Sarah: ${sarahId}\n  Mike:  ${mikeId}\n`);

  // ── Contacts (Jason: Sarah=ring4, Mike=ring2. Sarah: Jason=ring4, Mike=ring3. Mike: Jason=ring2, Sarah=ring4) ──
  console.log("  Setting up contacts...");
  await seedContacts(jasonClient, jasonId, [
    { email: USERS.sarah.email, name: "Sarah", ringLevel: 4, userId: sarahId },
    { email: USERS.mike.email, name: "Mike", ringLevel: 2, userId: mikeId },
  ]);
  await seedContacts(sarahClient, sarahId, [
    { email: USERS.jason.email, name: "Jason", ringLevel: 4, userId: jasonId },
    { email: USERS.mike.email, name: "Mike", ringLevel: 3, userId: mikeId },
  ]);
  await seedContacts(mikeClient, mikeId, [
    { email: USERS.jason.email, name: "Jason", ringLevel: 2, userId: jasonId },
    { email: USERS.sarah.email, name: "Sarah", ringLevel: 4, userId: sarahId },
  ]);

  // ── Child contacts (for Kids entries) ──
  const jasonChildId = crypto.randomUUID();
  const sarahChildId = crypto.randomUUID();
  await jasonClient.from("contacts").upsert(
    { id: jasonChildId, owner_id: jasonId, display_name: "Ethan", is_child: true, birthday: "2016-07-14", email: null, invite_status: "accepted" },
    { onConflict: "id" }
  );
  await sarahClient.from("contacts").upsert(
    { id: sarahChildId, owner_id: sarahId, display_name: "Lily", is_child: true, birthday: "2015-03-22", email: null, invite_status: "accepted" },
    { onConflict: "id" }
  );
  console.log("  Child contacts created (Jason→Ethan, Sarah→Lily)");

  // ── Items ──
  const allEntries = {};

  for (const [name, client, userId, moviesFn, eventsFn, travelFn, activitiesFn, cellarFn, carsFn, homesFn, kidsFn] of [
    ["Jason", jasonClient, jasonId, () => jasonMovies(sarahId), jasonEvents, jasonTravel, jasonActivities, jasonCellar, jasonCars, jasonHomes, () => jasonKids(jasonChildId)],
    ["Sarah", sarahClient, sarahId, sarahMovies, sarahEvents, sarahTravel, sarahActivities, sarahCellar, sarahCars, sarahHomes, () => sarahKids(sarahChildId)],
    ["Mike", mikeClient, mikeId, mikeMovies, mikeEvents, mikeTravel, mikeActivities, mikeCellar, mikeCars, mikeHomes, null],
  ]) {
    console.log(`\n  Seeding ${name}...`);
    const entries = [];

    // Movies (status already in data object from factory)
    const movies = moviesFn();
    const movieRows = movies.map(m => ({ id: m.id, user_id: userId, category: "movies", status: m.status, start_date: m.startDate || null, data: m }));
    const { data: mData, error: mErr } = await client.from("items").insert(movieRows).select("id");
    console.log(`    Movies: ${mErr ? `ERROR ${mErr.message}` : `${mData.length} created`}`);
    entries.push(...(mData || []));

    // Events — inject status + id into data JSONB
    const events = eventsFn();
    const eventRows = events.map(e => ({ ...e, user_id: userId, data: { ...e.data, id: e.id, status: e.status } }));
    const { data: eData, error: eErr } = await client.from("items").insert(eventRows).select("id");
    console.log(`    Events: ${eErr ? `ERROR ${eErr.message}` : `${eData.length} created`}`);
    entries.push(...(eData || []));

    // Travel — inject status + id into data JSONB
    const travel = travelFn();
    const travelRows = travel.map(t => ({ ...t, user_id: userId, data: { ...t.data, id: t.id, status: t.status } }));
    const { data: tData, error: tErr } = await client.from("items").insert(travelRows).select("id");
    console.log(`    Travel: ${tErr ? `ERROR ${tErr.message}` : `${tData.length} created`}`);
    entries.push(...(tData || []));

    // Activities — inject status + id into data JSONB
    const activities = activitiesFn();
    const actRows = activities.map(a => ({ ...a, user_id: userId, data: { ...a.data, id: a.id, status: a.status } }));
    const { data: aData, error: aErr } = await client.from("items").insert(actRows).select("id");
    console.log(`    Activities: ${aErr ? `ERROR ${aErr.message}` : `${aData.length} created`}`);
    entries.push(...(aData || []));

    // Cellar — inject status + id into data JSONB
    const cellar = cellarFn();
    const cellarRows = cellar.map(c => ({ ...c, user_id: userId, data: { ...c.data, id: c.id, status: c.status } }));
    const { data: cData, error: cErr } = await client.from("items").insert(cellarRows).select("id");
    console.log(`    Cellar: ${cErr ? `ERROR ${cErr.message}` : `${cData.length} created`}`);
    entries.push(...(cData || []));

    // Cars — inject status + id into data JSONB
    const cars = carsFn();
    const carRows = cars.map(c => ({ ...c, user_id: userId, data: { ...c.data, id: c.id, status: c.status } }));
    const { data: carData, error: carErr } = await client.from("items").insert(carRows).select("id");
    console.log(`    Cars: ${carErr ? `ERROR ${carErr.message}` : `${carData.length} created`}`);
    entries.push(...(carData || []));

    // Homes — inject status + id into data JSONB
    const homes = homesFn();
    const homeRows = homes.map(h => ({ ...h, user_id: userId, data: { ...h.data, id: h.id, status: h.status } }));
    const { data: hData, error: hErr } = await client.from("items").insert(homeRows).select("id");
    console.log(`    Homes: ${hErr ? `ERROR ${hErr.message}` : `${hData.length} created`}`);
    entries.push(...(hData || []));

    // Kids — inject status + id into data JSONB (Jason + Sarah only)
    if (kidsFn) {
      const kids = kidsFn();
      const kidRows = kids.map(k => ({ ...k, user_id: userId, data: { ...k.data, id: k.id, status: k.status } }));
      const { data: kData, error: kErr } = await client.from("items").insert(kidRows).select("id");
      console.log(`    Kids: ${kErr ? `ERROR ${kErr.message}` : `${kData.length} created`}`);
      entries.push(...(kData || []));
    }

    allEntries[name] = { client, userId, movieIds: (mData || []).map(d => d.id), eventIds: (eData || []).map(d => d.id), travelIds: (tData || []).map(d => d.id), activityIds: (aData || []).map(d => d.id) };
  }

  // ── Social Features ──
  console.log("\n  Setting up social features...");
  const J = allEntries.Jason, S = allEntries.Sarah, M = allEntries.Mike;

  // ────────────────────────────────────────────────────────────────────────────
  // COLLABORATIONS — Multiple people, accepted with overlays
  // ────────────────────────────────────────────────────────────────────────────

  // 1. Sarah shares Taylor Swift event with Jason (accepted) + Mike (accepted)
  //    Both add overlays with snaps
  if (S.eventIds[0]) {
    await sarahClient.from("collaborators").insert([
      { entry_id: S.eventIds[0], entry_category: "events", owner_id: sarahId, collaborator_user_id: jasonId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() },
      { entry_id: S.eventIds[0], entry_category: "events", owner_id: sarahId, collaborator_user_id: mikeId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() },
    ]);
    await jasonClient.from("overlays").upsert({ entry_id: S.eventIds[0], user_id: jasonId, snapshot1: "The Travis Kelce moment when he came on stage was wild", snapshot2: "Sarah cried during All Too Well — so did I honestly", rating: 5, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    await mikeClient.from("overlays").upsert({ entry_id: S.eventIds[0], user_id: mikeId, snapshot1: "Not my usual scene but even I was dancing", rating: 4, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Sarah's Taylor Swift → Jason+Mike accepted, both have overlays");
  }

  // 2. Jason shares Super Bowl with Mike (accepted) + Sarah (pending — she hasn't responded yet)
  if (J.eventIds[1]) {
    await jasonClient.from("collaborators").insert([
      { entry_id: J.eventIds[1], entry_category: "events", owner_id: jasonId, collaborator_user_id: mikeId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() },
      { entry_id: J.eventIds[1], entry_category: "events", owner_id: jasonId, collaborator_user_id: sarahId, status: "pending", can_edit: true, invited_at: new Date().toISOString() },
    ]);
    await mikeClient.from("overlays").upsert({ entry_id: J.eventIds[1], user_id: mikeId, snapshot1: "The overtime TD — I've never screamed louder in my life", snapshot2: "Jason spilled his beer on that play", rating: 5, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Jason's Super Bowl → Mike accepted (overlay), Sarah pending");
  }

  // 3. Sarah shares Paris trip with Jason (accepted) — travel collaboration
  if (S.travelIds[0]) {
    await sarahClient.from("collaborators").insert({
      entry_id: S.travelIds[0], entry_category: "travel", owner_id: sarahId, collaborator_user_id: jasonId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString(),
    });
    await jasonClient.from("overlays").upsert({ entry_id: S.travelIds[0], user_id: jasonId, snapshot1: "That tiny restaurant she found in the 5th was perfection", snapshot2: "Getting lost in Montmartre at midnight", rating: 5, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Sarah's Paris trip → Jason accepted with overlay");
  }

  // 4. Mike shares Patagonia trek with Jason (accepted) — activity collaboration
  if (M.activityIds[1]) {
    await mikeClient.from("collaborators").insert({
      entry_id: M.activityIds[1], entry_category: "activities", owner_id: mikeId, collaborator_user_id: jasonId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString(),
    });
    await jasonClient.from("overlays").upsert({ entry_id: M.activityIds[1], user_id: jasonId, snapshot1: "Day 3 was brutal but the glacier view made it worth every step", rating: 5, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Mike's Patagonia trek → Jason accepted with overlay");
  }

  // 5. Jason shares ACL Festival with Sarah (accepted) + Mike (accepted)
  if (J.eventIds[2]) {
    await jasonClient.from("collaborators").insert([
      { entry_id: J.eventIds[2], entry_category: "events", owner_id: jasonId, collaborator_user_id: sarahId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() },
      { entry_id: J.eventIds[2], entry_category: "events", owner_id: jasonId, collaborator_user_id: mikeId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() },
    ]);
    await sarahClient.from("overlays").upsert({ entry_id: J.eventIds[2], user_id: sarahId, snapshot1: "The sunset during Tame Impala was unreal", snapshot2: "Best food trucks I've ever had at a festival", rating: 5, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    await mikeClient.from("overlays").upsert({ entry_id: J.eventIds[2], user_id: mikeId, snapshot1: "Three days, zero sleep, no regrets", rating: 5, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Jason's ACL Festival → Sarah+Mike accepted, both have overlays");
  }

  // 6. Mike shares his movie (The Raid) with Jason (accepted) — movie collaboration
  if (M.movieIds[7]) {
    await mikeClient.from("collaborators").insert({
      entry_id: M.movieIds[7], entry_category: "movies", owner_id: mikeId, collaborator_user_id: jasonId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString(),
    });
    await jasonClient.from("overlays").upsert({ entry_id: M.movieIds[7], user_id: jasonId, snapshot1: "The hallway fight scene is insane — watched it three times", rating: 5, updated_at: new Date().toISOString() }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Mike's The Raid → Jason accepted with overlay");
  }

  // 7. Mike shares Top Gun: Maverick with Jason (pending — incoming for Jason)
  if (M.movieIds[6]) {
    await mikeClient.from("collaborators").insert({
      entry_id: M.movieIds[6], entry_category: "movies", owner_id: mikeId, collaborator_user_id: jasonId, status: "pending", can_edit: true, invited_at: new Date().toISOString(),
    });
    console.log("    ✓ Mike's Top Gun: Maverick → Jason pending (incoming collab)");
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RECOMMENDATIONS — active, accepted, dismissed across categories
  // ────────────────────────────────────────────────────────────────────────────

  const recs = [];

  // Active (pending) recommendations TO Jason
  if (M.eventIds[1]) recs.push({ from_user_id: mikeId, entry_id: M.eventIds[1], entry_category: "events", to_user_id: jasonId, status: "active" }); // Metallica
  if (M.travelIds[0]) recs.push({ from_user_id: mikeId, entry_id: M.travelIds[0], entry_category: "travel", to_user_id: jasonId, status: "active" }); // Patagonia
  if (M.movieIds[8]) recs.push({ from_user_id: mikeId, entry_id: M.movieIds[8], entry_category: "movies", to_user_id: jasonId, status: "active" }); // Sicario

  // Accepted recommendations (Jason already added to his list — has recommendedBy in data)
  if (S.movieIds[6]) recs.push({ from_user_id: sarahId, entry_id: S.movieIds[6], entry_category: "movies", to_user_id: jasonId, status: "accepted" }); // Past Lives
  if (S.movieIds[10]) recs.push({ from_user_id: sarahId, entry_id: S.movieIds[10], entry_category: "movies", to_user_id: jasonId, status: "accepted" }); // Poor Things
  if (S.activityIds[0]) recs.push({ from_user_id: sarahId, entry_id: S.activityIds[0], entry_category: "activities", to_user_id: jasonId, status: "accepted" }); // Angels Landing

  // Dismissed recommendations (Jason declined)
  if (S.movieIds[11]) recs.push({ from_user_id: sarahId, entry_id: S.movieIds[11], entry_category: "movies", to_user_id: jasonId, status: "dismissed" }); // Barbie
  if (M.activityIds[3]) recs.push({ from_user_id: mikeId, entry_id: M.activityIds[3], entry_category: "activities", to_user_id: jasonId, status: "dismissed" }); // Scuba Belize

  // Ring-based recommendations (Jason recommends to ring 4 = Sarah)
  if (J.movieIds[1]) recs.push({ from_user_id: jasonId, entry_id: J.movieIds[1], entry_category: "movies", to_user_id: null, to_ring_level: 4, status: "active" }); // Inception → ring 4
  if (J.travelIds[0]) recs.push({ from_user_id: jasonId, entry_id: J.travelIds[0], entry_category: "travel", to_user_id: null, to_ring_level: 4, status: "active" }); // Barcelona → ring 4

  // Recommendations FROM Jason to Mike (direct)
  if (J.eventIds[0]) recs.push({ from_user_id: jasonId, entry_id: J.eventIds[0], entry_category: "events", to_user_id: mikeId, status: "active" }); // Radiohead

  // Recommendations FROM Jason to Sarah (various states)
  if (J.movieIds[7]) recs.push({ from_user_id: jasonId, entry_id: J.movieIds[7], entry_category: "movies", to_user_id: sarahId, status: "active" }); // Oppenheimer
  if (J.activityIds[2]) recs.push({ from_user_id: jasonId, entry_id: J.activityIds[2], entry_category: "activities", to_user_id: sarahId, status: "accepted" }); // Moab biking

  if (recs.length > 0) {
    const { error: recErr } = await sarahClient.from("recommendations").insert(recs.filter(r => r.from_user_id === sarahId));
    const { error: recErr2 } = await mikeClient.from("recommendations").insert(recs.filter(r => r.from_user_id === mikeId));
    const { error: recErr3 } = await jasonClient.from("recommendations").insert(recs.filter(r => r.from_user_id === jasonId));
    const errors = [recErr, recErr2, recErr3].filter(Boolean);
    if (errors.length) console.log(`    WARN: Some rec inserts failed: ${errors.map(e => e.message).join(", ")}`);
    console.log(`    ✓ ${recs.length} recommendations created (active/accepted/dismissed across categories)`);
  }

  // ── Patch recommendedBy with denormalized rating + snaps ──────────────────
  // Our UI reads rating/snaps directly from recommendedBy (RLS blocks cross-user fetch)

  // Jason's "Poor Things" (idx 16) ← Sarah's entry (idx 10)
  const jasonPoorThingsId = J.movieIds[16];
  const sarahPoorThingsId = S.movieIds[10];
  if (jasonPoorThingsId && sarahPoorThingsId) {
    const { data: jEntry } = await jasonClient.from("items").select("data").eq("id", jasonPoorThingsId).single();
    if (jEntry) {
      await jasonClient.from("items").update({
        data: { ...jEntry.data, recommendedBy: [{ userId: sarahId, displayName: "Sarah", entryId: sarahPoorThingsId, acceptedAt: "2025-05-20T10:00:00.000Z", rating: 5, snaps: ["Emma Stone is fearless in this"] }] }
      }).eq("id", jasonPoorThingsId);
    }
  }

  // Jason's "Past Lives" (idx 17) ← Sarah's entry (idx 6)
  const jasonPastLivesId = J.movieIds[17];
  const sarahPastLivesId = S.movieIds[6];
  if (jasonPastLivesId && sarahPastLivesId) {
    const { data: jEntry } = await jasonClient.from("items").select("data").eq("id", jasonPastLivesId).single();
    if (jEntry) {
      await jasonClient.from("items").update({
        data: { ...jEntry.data, recommendedBy: [{ userId: sarahId, displayName: "Sarah", entryId: sarahPastLivesId, acceptedAt: "2025-05-22T10:00:00.000Z", rating: 5, snaps: ["The ending bench scene broke me", "In-yun is such a beautiful concept"] }] }
      }).eq("id", jasonPastLivesId);
    }
  }

  console.log("    ✓ Patched recommendedBy with denormalized rating + snaps");

  console.log("\n\x1b[32m  ✓ Done! Seeded realistic data for all 3 users.\x1b[0m\n");
}

async function seedContacts(client, ownerId, otherUsers) {
  for (const { email, name, ringLevel, userId } of otherUsers) {
    await client.from("contacts").upsert(
      { owner_id: ownerId, email, display_name: name, ring_level: ringLevel, linked_user_id: userId, invite_status: "accepted" },
      { onConflict: "owner_id,email", ignoreDuplicates: false }
    );
  }
}

main().catch(err => {
  console.error(`\x1b[31mFatal: ${err.message}\x1b[0m`);
  process.exit(1);
});
