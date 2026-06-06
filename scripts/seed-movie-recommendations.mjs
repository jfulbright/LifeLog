/**
 * Seed script: populates movie data across 3 test users with recommendations.
 * Run from project root: node scripts/seed-movie-recommendations.mjs
 *
 * Creates 20+ movies per user with overlapping tmdbIds for taste alignment,
 * cross-user recommendations, accepted recs with recommendedBy tracking,
 * and companion tagging for watch-party stats.
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
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error) throw new Error(`Auth failed for ${user.email}: ${error.message}`);
  console.log(`  ✓ Logged in as ${user.email} (${data.user.id})`);
  return { client, userId: data.user.id };
}

const POSTER_PATHS = {
  278: "/9cjIGRiQGMTAnaW5t1fBYMbxEmt.jpg",
  27205: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
  496243: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  155: "/qJ2tW6WMUDux911Ma1cDz1DEC0J.jpg",
  157336: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  244786: "/oPxnRhyAIzJKElMQxaaFSqMjMQo.jpg",
  545611: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
  666277: "/k3waqVXSnvCDWcJq0VQ2oG1CoDP.jpg",
  840430: "/VHSzNBTwxV8vh7wylo7O9CLdac.jpg",
  872585: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
  76341: "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
  603692: "/vZloFAK7NmvMGKE7VKF5A6TnTst.jpg",
  361743: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
  438631: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
  414906: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
  329865: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
  546554: "/qDRwLBQxIFOCMsYSn5M9LjIBMEa.jpg",
  569094: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
  466420: "/dB6Krk806zeqd0YNp2ngQ9zXteR.jpg",
  120467: "/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
  792307: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
  915935: "/kQs6keheMwCxJxrzV83VUwFtHkB.jpg",
  521029: "/oFyrEhP0j5BjGnlqFHWJMsfglWY.jpg",
  391713: "/iySFtKLrWvVTkNTnSMFBpXo27XF.jpg",
  531428: "/2LquGwaFhmFQ1PEyaKSTXywz1lo.jpg",
  376867: "/4911T5FbJ9eD2Faz5Z8cT3SUhU3.jpg",
  530915: "/yn5ihODtZ7ofn8pDYfxCmxh8AXI.jpg",
  582014: "/73QoAdi5Hed3VJzb1VoiqVhMtMn.jpg",
  346698: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
  94329: "/3V3MqlFE2Jb5QOcEzYTE6OFXRqY.jpg",
  273481: "/dBrpQ0g3i2JxMJHCPfUJmMKjjjl.jpg",
  98: "/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
  6977: "/bj1v6YKF8yHqA489GFiPGKFcHcT.jpg",
  374720: "/eFbcNe3LkK4gEK3tn3GDoZWYQ5x.jpg",
  281957: "/ji3ecJphATlVgWNY0B4RKm4sGRr.jpg",
  530915: "/iZf0KyrE25z1sage4SYFDuEQpP9.jpg",
  577922: "/k68nPLbIST6NP96JmTxmZijEvCA.jpg",
  228150: "/pKawqrtCBMmxarft7o1LbEynys7.jpg",
};

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function movie(tmdbId, title, year, genre, director, rating, startDate, extras = {}) {
  return {
    id: crypto.randomUUID(),
    tmdbId: String(tmdbId),
    title,
    year: String(year),
    genre,
    director,
    rating,
    status: "watched",
    startDate,
    posterUrl: POSTER_PATHS[tmdbId] ? `${TMDB_IMG}${POSTER_PATHS[tmdbId]}` : "",
    visibilityRings: [1, 2, 3, 4],
    ...extras,
  };
}

function watchlistMovie(tmdbId, title, year, genre, director, extras = {}) {
  return {
    id: crypto.randomUUID(),
    tmdbId: String(tmdbId),
    title,
    year: String(year),
    genre,
    director,
    status: "watchlist",
    posterUrl: POSTER_PATHS[tmdbId] ? `${TMDB_IMG}${POSTER_PATHS[tmdbId]}` : "",
    visibilityRings: [1, 2, 3, 4],
    ...extras,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOVIE DATA
// ═══════════════════════════════════════════════════════════════════════════════

// Overlap movies (all 3 users rate)
const OVERLAP_ALL = {
  shawshank: { tmdbId: 278, title: "The Shawshank Redemption", year: 1994, genre: "Drama, Crime", director: "Frank Darabont" },
  inception: { tmdbId: 27205, title: "Inception", year: 2010, genre: "Sci-Fi, Action, Thriller", director: "Christopher Nolan" },
  parasite: { tmdbId: 496243, title: "Parasite", year: 2019, genre: "Thriller, Drama, Comedy", director: "Bong Joon-ho" },
  darkKnight: { tmdbId: 155, title: "The Dark Knight", year: 2008, genre: "Action, Crime, Thriller", director: "Christopher Nolan" },
  interstellar: { tmdbId: 157336, title: "Interstellar", year: 2014, genre: "Sci-Fi, Drama, Adventure", director: "Christopher Nolan" },
  whiplash: { tmdbId: 244786, title: "Whiplash", year: 2014, genre: "Drama, Music", director: "Damien Chazelle" },
};

// Jason + Sarah overlap only
const OVERLAP_JS = {
  eeaao: { tmdbId: 545611, title: "Everything Everywhere All at Once", year: 2022, genre: "Sci-Fi, Action, Comedy", director: "Daniel Kwan, Daniel Scheinert" },
  pastLives: { tmdbId: 666277, title: "Past Lives", year: 2023, genre: "Drama, Romance", director: "Celine Song" },
  holdovers: { tmdbId: 840430, title: "The Holdovers", year: 2023, genre: "Drama, Comedy", director: "Alexander Payne" },
  oppenheimer: { tmdbId: 872585, title: "Oppenheimer", year: 2023, genre: "Drama, History, Thriller", director: "Christopher Nolan" },
};

// Jason + Mike overlap only
const OVERLAP_JM = {
  madMax: { tmdbId: 76341, title: "Mad Max: Fury Road", year: 2015, genre: "Action, Adventure, Sci-Fi", director: "George Miller" },
  johnWick4: { tmdbId: 603692, title: "John Wick: Chapter 4", year: 2023, genre: "Action, Thriller, Crime", director: "Chad Stahelski" },
  topGun: { tmdbId: 361743, title: "Top Gun: Maverick", year: 2022, genre: "Action, Drama", director: "Joseph Kosinski" },
};

// ═══ JASON'S MOVIES ═══════════════════════════════════════════════════════════

function jasonMovies(sarahId) {
  return [
    // Overlap (all 3)
    movie(278, "The Shawshank Redemption", 1994, "Drama, Crime", "Frank Darabont", 5, "2025-01-15"),
    movie(27205, "Inception", 2010, "Sci-Fi, Action, Thriller", "Christopher Nolan", 5, "2025-02-10", {
      companions: [{ displayName: "Sarah", type: "contact" }],
    }),
    movie(496243, "Parasite", 2019, "Thriller, Drama, Comedy", "Bong Joon-ho", 4, "2025-03-05"),
    movie(155, "The Dark Knight", 2008, "Action, Crime, Thriller", "Christopher Nolan", 5, "2025-01-20"),
    movie(157336, "Interstellar", 2014, "Sci-Fi, Drama, Adventure", "Christopher Nolan", 5, "2025-04-12", {
      companions: [{ displayName: "Sarah", type: "contact" }, { displayName: "Mike", type: "contact" }],
    }),
    movie(244786, "Whiplash", 2014, "Drama, Music", "Damien Chazelle", 4, "2025-02-28"),
    // Overlap (Jason + Sarah)
    movie(545611, "Everything Everywhere All at Once", 2022, "Sci-Fi, Action, Comedy", "Daniel Kwan, Daniel Scheinert", 5, "2025-03-20"),
    movie(666277, "Past Lives", 2023, "Drama, Romance", "Celine Song", 4, "2025-05-10"),
    movie(840430, "The Holdovers", 2023, "Drama, Comedy", "Alexander Payne", 4, "2025-04-01"),
    movie(872585, "Oppenheimer", 2023, "Drama, History, Thriller", "Christopher Nolan", 5, "2025-01-05"),
    // Overlap (Jason + Mike)
    movie(76341, "Mad Max: Fury Road", 2015, "Action, Adventure, Sci-Fi", "George Miller", 5, "2025-05-22"),
    movie(603692, "John Wick: Chapter 4", 2023, "Action, Thriller, Crime", "Chad Stahelski", 4, "2025-06-15"),
    movie(361743, "Top Gun: Maverick", 2022, "Action, Drama", "Joseph Kosinski", 4, "2025-02-14"),
    // Jason unique
    movie(438631, "Dune", 2021, "Sci-Fi, Adventure", "Denis Villeneuve", 5, "2025-03-10", {
      snapshot1: "Denis Villeneuve made the impossible adaptation work",
      snapshot2: "Hans Zimmer's score is otherworldly",
    }),
    movie(414906, "The Batman", 2022, "Action, Crime, Mystery", "Matt Reeves", 4, "2025-04-20"),
    movie(329865, "Arrival", 2016, "Sci-Fi, Drama", "Denis Villeneuve", 5, "2025-01-30"),
    movie(546554, "Knives Out", 2019, "Mystery, Comedy, Crime", "Rian Johnson", 4, "2025-05-05"),
    movie(569094, "Spider-Man: Across the Spider-Verse", 2023, "Animation, Action, Adventure", "Joaquim Dos Santos", 5, "2025-06-01"),
    movie(466420, "Killers of the Flower Moon", 2023, "Drama, History, Crime", "Martin Scorsese", 4, "2025-07-12"),
    movie(120467, "The Grand Budapest Hotel", 2014, "Comedy, Drama, Adventure", "Wes Anderson", 4, "2025-08-03"),
    // Accepted recommendation from Sarah (has recommendedBy — entryId patched below)
    movie(792307, "Poor Things", 2023, "Sci-Fi, Comedy, Drama", "Yorgos Lanthimos", 5, "2025-09-15", {
      recommendedBy: [{ displayName: "Sarah" }],
    }),
    // Watchlist
    watchlistMovie(915935, "Anatomy of a Fall", 2023, "Drama, Thriller", "Justine Triet"),
    watchlistMovie(521029, "The Farewell", 2019, "Drama, Comedy", "Lulu Wang"),
  ];
}

// ═══ SARAH'S MOVIES ═══════════════════════════════════════════════════════════

function sarahMovies(jasonId) {
  return [
    // Overlap (all 3)
    movie(278, "The Shawshank Redemption", 1994, "Drama, Crime", "Frank Darabont", 5, "2025-01-20"),
    movie(27205, "Inception", 2010, "Sci-Fi, Action, Thriller", "Christopher Nolan", 4, "2025-02-15"),
    movie(496243, "Parasite", 2019, "Thriller, Drama, Comedy", "Bong Joon-ho", 5, "2025-03-10", {
      companions: [{ displayName: "Jason", type: "contact" }],
    }),
    movie(155, "The Dark Knight", 2008, "Action, Crime, Thriller", "Christopher Nolan", 3, "2025-01-25"),
    movie(157336, "Interstellar", 2014, "Sci-Fi, Drama, Adventure", "Christopher Nolan", 5, "2025-04-18"),
    movie(244786, "Whiplash", 2014, "Drama, Music", "Damien Chazelle", 5, "2025-03-01"),
    // Overlap (Jason + Sarah)
    movie(545611, "Everything Everywhere All at Once", 2022, "Sci-Fi, Action, Comedy", "Daniel Kwan, Daniel Scheinert", 5, "2025-03-25"),
    movie(666277, "Past Lives", 2023, "Drama, Romance", "Celine Song", 5, "2025-05-15"),
    movie(840430, "The Holdovers", 2023, "Drama, Comedy", "Alexander Payne", 4, "2025-04-05"),
    movie(872585, "Oppenheimer", 2023, "Drama, History, Thriller", "Christopher Nolan", 4, "2025-01-10"),
    // Sarah unique
    movie(391713, "Lady Bird", 2017, "Drama, Comedy", "Greta Gerwig", 5, "2025-02-05", {
      snapshot1: "Greta Gerwig captures adolescence perfectly",
    }),
    movie(531428, "Portrait of a Lady on Fire", 2019, "Drama, Romance", "Céline Sciamma", 5, "2025-04-25"),
    movie(376867, "Moonlight", 2016, "Drama", "Barry Jenkins", 5, "2025-05-30"),
    movie(530915, "Little Women", 2019, "Drama, Romance", "Greta Gerwig", 4, "2025-06-10"),
    movie(521029, "The Farewell", 2019, "Drama, Comedy", "Lulu Wang", 4, "2025-07-20"),
    movie(582014, "Promising Young Woman", 2020, "Thriller, Drama", "Emerald Fennell", 4, "2025-08-15"),
    movie(915935, "Anatomy of a Fall", 2023, "Drama, Thriller", "Justine Triet", 5, "2025-09-01", {
      snapshot1: "The courtroom scenes had me holding my breath",
      snapshot2: "Best screenplay I've seen in years",
    }),
    movie(792307, "Poor Things", 2023, "Sci-Fi, Comedy, Drama", "Yorgos Lanthimos", 5, "2025-09-20", {
      snapshot1: "Emma Stone gives the performance of a lifetime",
      snapshot2: "Visually unlike anything I've ever seen",
    }),
    movie(346698, "Barbie", 2023, "Comedy, Fantasy, Adventure", "Greta Gerwig", 4, "2025-07-05"),
    // Accepted recommendation from Jason (has recommendedBy — entryId patched below)
    movie(438631, "Dune", 2021, "Sci-Fi, Adventure", "Denis Villeneuve", 4, "2025-10-01", {
      recommendedBy: [{ displayName: "Jason" }],
    }),
    // Watchlist
    watchlistMovie(76341, "Mad Max: Fury Road", 2015, "Action, Adventure, Sci-Fi", "George Miller"),
    watchlistMovie(361743, "Top Gun: Maverick", 2022, "Action, Drama", "Joseph Kosinski"),
  ];
}

// ═══ MIKE'S MOVIES ═══════════════════════════════════════════════════════════

function mikeMovies() {
  return [
    // Overlap (all 3)
    movie(278, "The Shawshank Redemption", 1994, "Drama, Crime", "Frank Darabont", 4, "2025-01-25"),
    movie(27205, "Inception", 2010, "Sci-Fi, Action, Thriller", "Christopher Nolan", 5, "2025-02-20"),
    movie(496243, "Parasite", 2019, "Thriller, Drama, Comedy", "Bong Joon-ho", 5, "2025-03-15"),
    movie(155, "The Dark Knight", 2008, "Action, Crime, Thriller", "Christopher Nolan", 5, "2025-01-28", {
      companions: [{ displayName: "Jason", type: "contact" }, { displayName: "Sarah", type: "contact" }],
    }),
    movie(157336, "Interstellar", 2014, "Sci-Fi, Drama, Adventure", "Christopher Nolan", 4, "2025-04-22"),
    movie(244786, "Whiplash", 2014, "Drama, Music", "Damien Chazelle", 3, "2025-03-08"),
    // Overlap (Jason + Mike)
    movie(76341, "Mad Max: Fury Road", 2015, "Action, Adventure, Sci-Fi", "George Miller", 5, "2025-05-28"),
    movie(603692, "John Wick: Chapter 4", 2023, "Action, Thriller, Crime", "Chad Stahelski", 5, "2025-06-20"),
    movie(361743, "Top Gun: Maverick", 2022, "Action, Drama", "Joseph Kosinski", 4, "2025-02-18"),
    // Mike unique
    movie(94329, "The Raid", 2011, "Action, Thriller", "Gareth Evans", 5, "2025-04-10", {
      snapshot1: "Best action choreography ever filmed",
    }),
    movie(273481, "Sicario", 2015, "Thriller, Crime, Drama", "Denis Villeneuve", 5, "2025-05-05", {
      snapshot1: "Benicio del Toro is terrifyingly good",
      snapshot2: "The border crossing scene is peak tension",
    }),
    movie(98, "Gladiator", 2000, "Action, Drama, Adventure", "Ridley Scott", 5, "2025-06-01", {
      snapshot1: "Are you not entertained?! Still gives me chills",
    }),
    movie(6977, "No Country for Old Men", 2007, "Thriller, Crime, Drama", "Joel Coen, Ethan Coen", 4, "2025-07-15"),
    movie(374720, "Dunkirk", 2017, "War, Drama, Action", "Christopher Nolan", 4, "2025-08-05"),
    movie(281957, "The Revenant", 2015, "Adventure, Drama, Western", "Alejandro González Iñárritu", 4, "2025-08-20"),
    movie(530915, "1917", 2019, "War, Drama", "Sam Mendes", 5, "2025-09-10"),
    movie(577922, "Tenet", 2020, "Sci-Fi, Action, Thriller", "Christopher Nolan", 3, "2025-03-20"),
    movie(228150, "Fury", 2014, "War, Drama, Action", "David Ayer", 4, "2025-10-05"),
    // Watchlist
    watchlistMovie(666277, "Past Lives", 2023, "Drama, Romance", "Celine Song"),
    watchlistMovie(545611, "Everything Everywhere All at Once", 2022, "Sci-Fi, Action, Comedy", "Daniel Kwan, Daniel Scheinert"),
    watchlistMovie(391713, "Lady Bird", 2017, "Drama, Comedy", "Greta Gerwig"),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n🎬 Seeding movie data with recommendations...\n");

  console.log("Authenticating users...");
  const { client: jasonClient, userId: jasonId } = await getAuthClient(USERS.jason);
  const { client: sarahClient, userId: sarahId } = await getAuthClient(USERS.sarah);
  const { client: mikeClient, userId: mikeId } = await getAuthClient(USERS.mike);

  // Patch recommendedBy with actual user IDs and entry IDs
  const jasonMovieData = jasonMovies(sarahId);
  const sarahMovieData = sarahMovies(jasonId);
  const mikeMovieData = mikeMovies();

  // Jason's "Poor Things" was recommended by Sarah — denormalize her rating + snaps
  const poorThingsIdx = jasonMovieData.findIndex((m) => m.tmdbId === "792307");
  const sarahPoorThingsEntry = sarahMovieData.find((m) => m.tmdbId === "792307");
  if (poorThingsIdx >= 0 && sarahPoorThingsEntry) {
    jasonMovieData[poorThingsIdx].recommendedBy = [{
      userId: sarahId,
      displayName: "Sarah",
      entryId: sarahPoorThingsEntry.id,
      acceptedAt: "2025-09-15T00:00:00.000Z",
      rating: sarahPoorThingsEntry.rating,
      snaps: [sarahPoorThingsEntry.snapshot1, sarahPoorThingsEntry.snapshot2].filter(Boolean),
    }];
  }

  // Sarah's "Dune" was recommended by Jason — denormalize his rating + snaps
  const duneIdx = sarahMovieData.findIndex((m) => m.tmdbId === "438631");
  const jasonDuneEntry = jasonMovieData.find((m) => m.tmdbId === "438631");
  if (duneIdx >= 0 && jasonDuneEntry) {
    sarahMovieData[duneIdx].recommendedBy = [{
      userId: jasonId,
      displayName: "Jason",
      entryId: jasonDuneEntry.id,
      acceptedAt: "2025-10-01T00:00:00.000Z",
      rating: jasonDuneEntry.rating,
      snaps: [jasonDuneEntry.snapshot1, jasonDuneEntry.snapshot2].filter(Boolean),
    }];
  }

  // ── Insert movies ─────────────────────────────────────────────────────────

  async function insertMovies(client, userId, userName, movies) {
    console.log(`\nInserting ${userName}'s movies (${movies.length})...`);
    for (const m of movies) {
      const { error } = await client.from("items").upsert({
        id: m.id,
        user_id: userId,
        category: "movies",
        status: m.status,
        start_date: m.startDate || null,
        updated_at: new Date().toISOString(),
        data: m,
      });
      if (error) console.error(`  ✗ ${m.title}: ${error.message}`);
      else console.log(`  ✓ ${m.title} (${m.status}, ${m.rating ? m.rating + "★" : "wishlist"})`);
    }
  }

  await insertMovies(jasonClient, jasonId, "Jason", jasonMovieData);
  await insertMovies(sarahClient, sarahId, "Sarah", sarahMovieData);
  await insertMovies(mikeClient, mikeId, "Mike", mikeMovieData);

  // ── Create recommendations ────────────────────────────────────────────────

  console.log("\n📬 Creating recommendations...");

  async function createRec(client, fromId, entryId, { toUserId, toRingLevel, title, targetName }) {
    const row = {
      from_user_id: fromId,
      entry_id: entryId,
      entry_category: "movies",
      to_user_id: toUserId || null,
      to_ring_level: toRingLevel || null,
      status: "active",
    };
    const { error } = await client.from("recommendations").insert(row);
    if (error) console.error(`  ✗ Rec "${title}" → ${targetName}: ${error.message}`);
    else console.log(`  ✓ Rec "${title}" → ${targetName}`);
  }

  // Find entry IDs for recommendations
  const sarahPoorThings = sarahMovieData.find((m) => m.tmdbId === "792307");
  const sarahAnatomy = sarahMovieData.find((m) => m.tmdbId === "915935");
  const sarahLadyBird = sarahMovieData.find((m) => m.tmdbId === "391713");
  const sarahPortrait = sarahMovieData.find((m) => m.tmdbId === "531428");

  const jasonDune = jasonMovieData.find((m) => m.tmdbId === "438631");
  const jasonArrival = jasonMovieData.find((m) => m.tmdbId === "329865");
  const jasonSpiderVerse = jasonMovieData.find((m) => m.tmdbId === "569094");

  const mikeSicario = mikeMovieData.find((m) => m.tmdbId === "273481");
  const mikeRaid = mikeMovieData.find((m) => m.tmdbId === "94329");
  const mikeGladiator = mikeMovieData.find((m) => m.tmdbId === "98");

  // Sarah → Jason (direct)
  await createRec(sarahClient, sarahId, sarahPoorThings.id, { toUserId: jasonId, title: "Poor Things", targetName: "Jason (direct)" });
  await createRec(sarahClient, sarahId, sarahAnatomy.id, { toUserId: jasonId, title: "Anatomy of a Fall", targetName: "Jason (direct)" });

  // Sarah → ring 4 (Friends)
  await createRec(sarahClient, sarahId, sarahLadyBird.id, { toRingLevel: 4, title: "Lady Bird", targetName: "ring 4 (Friends)" });
  await createRec(sarahClient, sarahId, sarahPortrait.id, { toRingLevel: 4, title: "Portrait of a Lady on Fire", targetName: "ring 4 (Friends)" });

  // Jason → Sarah (direct)
  await createRec(jasonClient, jasonId, jasonDune.id, { toUserId: sarahId, title: "Dune", targetName: "Sarah (direct)" });
  await createRec(jasonClient, jasonId, jasonArrival.id, { toUserId: sarahId, title: "Arrival", targetName: "Sarah (direct)" });

  // Jason → ring 4
  await createRec(jasonClient, jasonId, jasonSpiderVerse.id, { toRingLevel: 4, title: "Spider-Man: Across the Spider-Verse", targetName: "ring 4 (Friends)" });

  // Mike → Jason (direct)
  await createRec(mikeClient, mikeId, mikeSicario.id, { toUserId: jasonId, title: "Sicario", targetName: "Jason (direct)" });
  await createRec(mikeClient, mikeId, mikeRaid.id, { toUserId: jasonId, title: "The Raid", targetName: "Jason (direct)" });

  // Mike → ring 4
  await createRec(mikeClient, mikeId, mikeGladiator.id, { toRingLevel: 4, title: "Gladiator", targetName: "ring 4 (Friends)" });

  // ── Mark some recommendations as accepted ─────────────────────────────────

  console.log("\n✅ Marking accepted recommendations...");

  // Sarah's "Poor Things" rec to Jason → accepted (Jason already has it with recommendedBy)
  const { data: poorThingsRec } = await sarahClient
    .from("recommendations")
    .select("id")
    .eq("from_user_id", sarahId)
    .eq("entry_id", sarahPoorThings.id)
    .eq("to_user_id", jasonId)
    .single();

  if (poorThingsRec) {
    await sarahClient.from("recommendations").update({ status: "accepted" }).eq("id", poorThingsRec.id);
    console.log("  ✓ Marked Sarah→Jason 'Poor Things' rec as accepted");
  }

  // Jason's "Dune" rec to Sarah → accepted (Sarah already has it with recommendedBy)
  const { data: duneRec } = await jasonClient
    .from("recommendations")
    .select("id")
    .eq("from_user_id", jasonId)
    .eq("entry_id", jasonDune.id)
    .eq("to_user_id", sarahId)
    .single();

  if (duneRec) {
    await jasonClient.from("recommendations").update({ status: "accepted" }).eq("id", duneRec.id);
    console.log("  ✓ Marked Jason→Sarah 'Dune' rec as accepted");
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  console.log("\n🎉 Movie seed complete!");
  console.log(`   Jason: ${jasonMovieData.length} movies (${jasonMovieData.filter((m) => m.status === "watched").length} watched, ${jasonMovieData.filter((m) => m.status === "watchlist").length} watchlist)`);
  console.log(`   Sarah: ${sarahMovieData.length} movies (${sarahMovieData.filter((m) => m.status === "watched").length} watched, ${sarahMovieData.filter((m) => m.status === "watchlist").length} watchlist)`);
  console.log(`   Mike:  ${mikeMovieData.length} movies (${mikeMovieData.filter((m) => m.status === "watched").length} watched, ${mikeMovieData.filter((m) => m.status === "watchlist").length} watchlist)`);
  console.log(`   Recommendations: 10 created, 2 pre-accepted`);
  console.log("\n   Test the stats at: /movies/stats (log in as each user)\n");
}

main().catch((err) => {
  console.error("\n💥 Seed failed:", err.message);
  process.exit(1);
});
