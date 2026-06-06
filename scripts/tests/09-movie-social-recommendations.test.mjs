import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, section, printSummary, getResults } from "./helpers/assertions.mjs";
import { makeMovie, makeMovieWatchlist, makeMovieRecommended, insertItem } from "./helpers/factories.mjs";

/**
 * Test 09 — Movie Social & Recommendations
 *
 * Validates the denormalized recommendation flow for movies:
 * - recommendedBy field with rating + snaps persists correctly
 * - Multiple recommenders on one movie
 * - Visibility defaults (visibilityRings: [1,2,3,4])
 * - Quick-add flow preserves posterUrl and visibilityRings
 * - Poster fallback behavior (empty posterUrl handled gracefully)
 */

async function run() {
  console.log("\n\x1b[1m🧪 09 — Movie Social & Recommendations\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  // ── Setup: Sarah creates a movie with snaps that she'll recommend ──
  section("Setup: Create source entries with snaps");

  const sarahMovie = makeMovie({
    data: {
      title: "Test Social Movie",
      director: "Test Director",
      year: 2024,
      genre: "Drama, Thriller",
      rating: 5,
      snapshot1: "Absolutely incredible performance",
      snapshot2: "The cinematography blew me away",
      posterUrl: "https://image.tmdb.org/t/p/w500/test-poster.jpg",
      tmdbId: "999001",
    },
  });

  const { data: sarahEntry, error: sarahErr } = await insertItem(sarah.client, sarah.userId, sarahMovie);
  if (sarahErr || !sarahEntry) {
    fail("Sarah creates movie with snaps", sarahErr?.message || "No data returned");
    printSummary();
    process.exit(1);
  }
  pass("Sarah creates movie with snaps", `id=${sarahEntry.id}, rating=5, 2 snaps`);

  // Mike also has this movie with different snaps
  const mikeMovie = makeMovie({
    data: {
      title: "Test Social Movie",
      director: "Test Director",
      year: 2024,
      genre: "Drama, Thriller",
      rating: 4,
      snapshot1: "Great but a bit slow in the middle",
      tmdbId: "999001",
    },
  });

  const { data: mikeEntry, error: mikeErr } = await insertItem(mike.client, mike.userId, mikeMovie);
  if (mikeErr || !mikeEntry) {
    fail("Mike creates same movie with snap", mikeErr?.message || "No data returned");
  } else {
    pass("Mike creates same movie with snap", `id=${mikeEntry.id}, rating=4, 1 snap`);
  }

  // ── Test 1: Create recommendation with denormalized rating + snaps ──
  section("Denormalized recommendedBy with rating + snaps");

  const recMovie = makeMovieRecommended(
    [
      {
        userId: sarah.userId,
        displayName: "Sarah",
        entryId: sarahEntry.id,
        acceptedAt: new Date().toISOString(),
        rating: 5,
        snaps: ["Absolutely incredible performance", "The cinematography blew me away"],
      },
      {
        userId: mike.userId,
        displayName: "Mike",
        entryId: mikeEntry.id,
        acceptedAt: new Date().toISOString(),
        rating: 4,
        snaps: ["Great but a bit slow in the middle"],
      },
    ],
    { data: { title: "Test Social Movie", tmdbId: "999001", posterUrl: "https://image.tmdb.org/t/p/w500/test-poster.jpg" } }
  );

  const { data: jasonEntry, error: jasonErr } = await insertItem(jason.client, jason.userId, recMovie);
  if (jasonErr || !jasonEntry) {
    fail("Jason creates movie with recommendedBy (2 recommenders)", jasonErr?.message || "No data returned");
    printSummary();
    process.exit(1);
  }
  pass("Jason creates movie with recommendedBy (2 recommenders)", `id=${jasonEntry.id}`);

  // Verify the data persisted correctly
  const { data: readBack } = await jason.client
    .from("items")
    .select("data")
    .eq("id", jasonEntry.id)
    .single();

  const rb = readBack?.data;
  if (!rb?.recommendedBy || !Array.isArray(rb.recommendedBy)) {
    fail("recommendedBy persists as array", `Got: ${typeof rb?.recommendedBy}`);
  } else {
    pass("recommendedBy persists as array", `length=${rb.recommendedBy.length}`);
  }

  // Verify first recommender has full denormalized data
  const rec0 = rb?.recommendedBy?.[0];
  if (rec0?.rating === 5 && rec0?.snaps?.length === 2) {
    pass("Recommender 1 (Sarah) has rating + snaps", `rating=${rec0.rating}, snaps=${rec0.snaps.length}`);
  } else {
    fail("Recommender 1 (Sarah) has rating + snaps", `rating=${rec0?.rating}, snaps=${rec0?.snaps?.length}`);
  }

  if (rec0?.entryId === sarahEntry.id) {
    pass("Recommender 1 has entryId", `entryId=${rec0.entryId}`);
  } else {
    fail("Recommender 1 has entryId", `Expected ${sarahEntry.id}, got ${rec0?.entryId}`);
  }

  if (rec0?.userId === sarah.userId) {
    pass("Recommender 1 has userId", `userId=${rec0.userId}`);
  } else {
    fail("Recommender 1 has userId", `Expected ${sarah.userId}, got ${rec0?.userId}`);
  }

  // Verify second recommender
  const rec1 = rb?.recommendedBy?.[1];
  if (rec1?.rating === 4 && rec1?.snaps?.length === 1) {
    pass("Recommender 2 (Mike) has rating + snaps", `rating=${rec1.rating}, snaps=${rec1.snaps.length}`);
  } else {
    fail("Recommender 2 (Mike) has rating + snaps", `rating=${rec1?.rating}, snaps=${rec1?.snaps?.length}`);
  }

  // ── Test 2: Visibility rings default ──
  section("Visibility defaults");

  if (JSON.stringify(rb?.visibilityRings) === JSON.stringify([1, 2, 3, 4])) {
    pass("visibilityRings defaults to all rings", "[1,2,3,4]");
  } else {
    fail("visibilityRings defaults to all rings", `Got: ${JSON.stringify(rb?.visibilityRings)}`);
  }

  // ── Test 3: posterUrl persists ──
  section("Poster URL persistence");

  if (rb?.posterUrl === "https://image.tmdb.org/t/p/w500/test-poster.jpg") {
    pass("posterUrl persists through save", rb.posterUrl);
  } else {
    fail("posterUrl persists through save", `Got: ${rb?.posterUrl}`);
  }

  // Test movie without posterUrl (fallback scenario)
  const noPosterMovie = makeMovieWatchlist({
    data: { title: "No Poster Movie", posterUrl: "" },
  });
  const { data: noPosterEntry } = await insertItem(jason.client, jason.userId, noPosterMovie);
  if (noPosterEntry?.data?.posterUrl === "") {
    pass("Empty posterUrl persists (fallback scenario)", "posterUrl=''");
  } else {
    fail("Empty posterUrl persists", `Got: ${noPosterEntry?.data?.posterUrl}`);
  }

  // ── Test 4: RLS blocks cross-user entry fetch ──
  section("RLS isolation for recommendation source entries");

  const { data: crossRead, error: crossErr } = await jason.client
    .from("items")
    .select("id")
    .eq("id", sarahEntry.id);

  if (!crossRead || crossRead.length === 0) {
    pass("Jason CANNOT read Sarah's entry directly (RLS enforced)", "Empty result");
  } else {
    fail("Jason CANNOT read Sarah's entry directly (RLS enforced)", `Got ${crossRead.length} rows`);
  }

  // ── Test 5: Quick-add simulation (mimics handleQuickAdd flow) ──
  section("Quick-add flow simulation");

  const quickAddData = {
    title: "Quick Added Movie",
    tmdbId: "999002",
    year: "2024",
    genre: "Action",
    posterUrl: "https://image.tmdb.org/t/p/w500/quick-add-poster.jpg",
    overview: "A test movie added via quick-add",
    status: "watchlist",
    startDate: "",
    visibilityRings: [1, 2, 3, 4],
  };

  const quickAddItem = {
    category: "movies",
    status: "watchlist",
    data: { ...quickAddData, id: undefined },
  };

  const { data: quickEntry, error: quickErr } = await insertItem(jason.client, jason.userId, quickAddItem);
  if (quickErr) {
    fail("Quick-add movie saves correctly", quickErr.message);
  } else {
    const qd = quickEntry.data;
    const checks = [
      qd.posterUrl === quickAddData.posterUrl,
      qd.visibilityRings?.length === 4,
      qd.status === "watchlist",
      qd.tmdbId === "999002",
    ];
    if (checks.every(Boolean)) {
      pass("Quick-add preserves posterUrl, visibility, status, tmdbId", "All fields intact");
    } else {
      fail("Quick-add preserves fields", `posterUrl=${!!qd.posterUrl}, vis=${qd.visibilityRings?.length}, status=${qd.status}, tmdbId=${qd.tmdbId}`);
    }
  }

  // ── Test 6: Multiple recommenders can be added incrementally ──
  section("Incremental recommender additions");

  // Add a third recommender to Jason's movie
  const { data: updated } = await jason.client
    .from("items")
    .select("data")
    .eq("id", jasonEntry.id)
    .single();

  const existingRecs = updated.data.recommendedBy || [];
  existingRecs.push({
    userId: "fake-user-id-alex",
    displayName: "Alex",
    acceptedAt: new Date().toISOString(),
    rating: 5,
    snaps: ["Absolutely phenomenal", "Director's best work"],
  });

  const { error: updateErr } = await jason.client
    .from("items")
    .update({ data: { ...updated.data, recommendedBy: existingRecs } })
    .eq("id", jasonEntry.id);

  if (updateErr) {
    fail("Add third recommender incrementally", updateErr.message);
  } else {
    const { data: verify } = await jason.client
      .from("items")
      .select("data")
      .eq("id", jasonEntry.id)
      .single();

    const recList = verify.data.recommendedBy || [];
    if (recList.length === 3) {
      pass("Three recommenders persisted", `Sarah + Mike + Alex`);
    } else {
      fail("Three recommenders persisted", `Got ${recList.length}`);
    }

    const alex = recList[2];
    if (alex?.displayName === "Alex" && alex?.rating === 5 && alex?.snaps?.length === 2) {
      pass("Third recommender has full data", `rating=${alex.rating}, snaps=${alex.snaps.length}`);
    } else {
      fail("Third recommender has full data", JSON.stringify(alex || "undefined"));
    }
  }

  // ── Cleanup ──
  section("Cleanup test entries");

  const testIds = [jasonEntry?.id, noPosterEntry?.id, quickEntry?.id].filter(Boolean);
  if (testIds.length > 0) {
    await jason.client.from("items").delete().in("id", testIds);
  }
  if (sarahEntry?.id) await sarah.client.from("items").delete().eq("id", sarahEntry.id);
  if (mikeEntry?.id) await mike.client.from("items").delete().eq("id", mikeEntry.id);
  pass("Test entries cleaned up", `${testIds.length + 2} entries removed`);

  const summary = printSummary();
  return { results: getResults(), summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
