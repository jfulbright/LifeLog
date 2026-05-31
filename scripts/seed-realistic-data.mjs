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

function jasonMovies() {
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

  // ── Items ──
  const allEntries = {};

  for (const [name, client, userId, moviesFn, eventsFn, travelFn, activitiesFn] of [
    ["Jason", jasonClient, jasonId, jasonMovies, jasonEvents, jasonTravel, jasonActivities],
    ["Sarah", sarahClient, sarahId, sarahMovies, sarahEvents, sarahTravel, sarahActivities],
    ["Mike", mikeClient, mikeId, mikeMovies, mikeEvents, mikeTravel, mikeActivities],
  ]) {
    console.log(`\n  Seeding ${name}...`);
    const entries = [];

    // Movies
    const movies = moviesFn();
    const movieRows = movies.map(m => ({ id: m.id, user_id: userId, category: "movies", status: m.status, start_date: m.startDate || null, data: m }));
    const { data: mData, error: mErr } = await client.from("items").insert(movieRows).select("id");
    console.log(`    Movies: ${mErr ? `ERROR ${mErr.message}` : `${mData.length} created`}`);
    entries.push(...(mData || []));

    // Events
    const events = eventsFn();
    const eventRows = events.map(e => ({ ...e, user_id: userId, data: { ...e.data, id: e.id } }));
    const { data: eData, error: eErr } = await client.from("items").insert(eventRows).select("id");
    console.log(`    Events: ${eErr ? `ERROR ${eErr.message}` : `${eData.length} created`}`);
    entries.push(...(eData || []));

    // Travel
    const travel = travelFn();
    const travelRows = travel.map(t => ({ ...t, user_id: userId, data: { ...t.data, id: t.id } }));
    const { data: tData, error: tErr } = await client.from("items").insert(travelRows).select("id");
    console.log(`    Travel: ${tErr ? `ERROR ${tErr.message}` : `${tData.length} created`}`);
    entries.push(...(tData || []));

    // Activities
    const activities = activitiesFn();
    const actRows = activities.map(a => ({ ...a, user_id: userId, data: { ...a.data, id: a.id } }));
    const { data: aData, error: aErr } = await client.from("items").insert(actRows).select("id");
    console.log(`    Activities: ${aErr ? `ERROR ${aErr.message}` : `${aData.length} created`}`);
    entries.push(...(aData || []));

    allEntries[name] = { client, userId, movieIds: (mData || []).map(d => d.id), eventIds: (eData || []).map(d => d.id) };
  }

  // ── Social Features ──
  console.log("\n  Setting up social features...");

  // Sarah shares her Taylor Swift event with Jason and Mike
  const sarahEventId = allEntries.Sarah.eventIds[0]; // Taylor Swift
  if (sarahEventId) {
    await sarahClient.from("collaborators").insert([
      { entry_id: sarahEventId, entry_category: "events", owner_id: sarahId, collaborator_user_id: jasonId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString() },
      { entry_id: sarahEventId, entry_category: "events", owner_id: sarahId, collaborator_user_id: mikeId, status: "pending", can_edit: true, invited_at: new Date().toISOString() },
    ]);

    // Jason adds an overlay
    await jasonClient.from("overlays").upsert({
      entry_id: sarahEventId, user_id: jasonId,
      snapshot1: "The Travis Kelce moment when he came on stage was wild",
      snapshot2: "Sarah cried during All Too Well — so did I honestly",
      rating: 5, updated_at: new Date().toISOString(),
    }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Shared Sarah's Taylor Swift event + Jason overlay");
  }

  // Jason shares his Super Bowl event with Mike
  const jasonSuperBowlId = allEntries.Jason.eventIds[1]; // Super Bowl
  if (jasonSuperBowlId) {
    await jasonClient.from("collaborators").insert({
      entry_id: jasonSuperBowlId, entry_category: "events", owner_id: jasonId, collaborator_user_id: mikeId, status: "accepted", can_edit: true, invited_at: new Date().toISOString(), accepted_at: new Date().toISOString(),
    });

    await mikeClient.from("overlays").upsert({
      entry_id: jasonSuperBowlId, user_id: mikeId,
      snapshot1: "The overtime TD — I've never screamed louder in my life",
      rating: 5, updated_at: new Date().toISOString(),
    }, { onConflict: "entry_id,user_id" });
    console.log("    ✓ Shared Jason's Super Bowl event + Mike overlay");
  }

  // Recommendations: Sarah recommends Past Lives to Jason (direct)
  const sarahPastLivesId = allEntries.Sarah.movieIds[6]; // Past Lives
  if (sarahPastLivesId) {
    await sarahClient.from("recommendations").insert({
      from_user_id: sarahId, entry_id: sarahPastLivesId, entry_category: "movies", to_user_id: jasonId, status: "active",
    });
    console.log("    ✓ Sarah recommends Past Lives to Jason");
  }

  // Jason recommends Inception to ring 4 (Friends)
  const jasonInceptionId = allEntries.Jason.movieIds[1]; // Inception
  if (jasonInceptionId) {
    await jasonClient.from("recommendations").insert({
      from_user_id: jasonId, entry_id: jasonInceptionId, entry_category: "movies", to_user_id: null, to_ring_level: 4, status: "active",
    });
    console.log("    ✓ Jason recommends Inception to ring 4");
  }

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
