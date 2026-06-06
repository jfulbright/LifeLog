import { getAllClients } from "./helpers/auth.mjs";
import { pass, fail, section, printSummary, getResults } from "./helpers/assertions.mjs";
import {
  makeEvent, makeEventWishlist, makeTravel, makeTravelWishlist,
  makeActivity, makeActivityWishlist, makeMovie, makeMovieWatchlist,
  makeCellarWine, makeCellarWhiskey, makeCar, makeCarWishlist,
  makeHome, makeHomeRented, makeKid, makeKidUpcoming, insertItem,
} from "./helpers/factories.mjs";

async function verifyCount(client, userId, category, expectedMin) {
  const { data, error } = await client
    .from("items")
    .select("id")
    .eq("user_id", userId)
    .eq("category", category);
  if (error) return { count: 0, error };
  return { count: data.length, error: null };
}

async function run() {
  console.log("\n\x1b[1m🧪 01 — Entry Creation (all categories)\x1b[0m\n");
  const { jason, sarah, mike } = await getAllClients();

  const testCases = [
    // Jason creates events + travel + activities + cars
    { user: jason, factory: makeEvent, label: "Jason: Event (attended)" },
    { user: jason, factory: makeEventWishlist, label: "Jason: Event (wishlist)" },
    { user: jason, factory: makeTravel, label: "Jason: Travel (visited)" },
    { user: jason, factory: makeTravelWishlist, label: "Jason: Travel (wishlist)" },
    { user: jason, factory: makeActivity, label: "Jason: Activity (done)" },
    { user: jason, factory: makeActivityWishlist, label: "Jason: Activity (wishlist)" },
    { user: jason, factory: makeCar, label: "Jason: Car (owned)" },
    { user: jason, factory: makeCarWishlist, label: "Jason: Car (wishlist)" },

    // Sarah creates movies + homes + cellar + kids
    { user: sarah, factory: makeMovie, label: "Sarah: Movie (watched)" },
    { user: sarah, factory: makeMovieWatchlist, label: "Sarah: Movie (watchlist)" },
    { user: sarah, factory: makeHome, label: "Sarah: Home (owned)" },
    { user: sarah, factory: makeHomeRented, label: "Sarah: Home (rented)" },
    { user: sarah, factory: makeCellarWine, label: "Sarah: Cellar (wine tried)" },
    { user: sarah, factory: makeCellarWhiskey, label: "Sarah: Cellar (whiskey in cellar)" },
    { user: sarah, factory: makeKid, label: "Sarah: Kids (happened)" },
    { user: sarah, factory: makeKidUpcoming, label: "Sarah: Kids (upcoming)" },

    // Mike creates one of each category for cross-user testing
    { user: mike, factory: makeEvent, label: "Mike: Event (attended)" },
    { user: mike, factory: makeTravel, label: "Mike: Travel (visited)" },
    { user: mike, factory: makeMovie, label: "Mike: Movie (watched)" },
    { user: mike, factory: makeActivity, label: "Mike: Activity (done)" },
  ];

  section("Insert entries");
  const createdIds = {};

  for (const tc of testCases) {
    const item = tc.factory();
    const { data, error } = await insertItem(tc.user.client, tc.user.userId, item);
    if (error) {
      fail(tc.label, error.message);
    } else {
      pass(tc.label, `id=${data.id}`);
      // Track IDs by user+category for later tests
      const key = `${tc.user.name}:${item.category}`;
      if (!createdIds[key]) createdIds[key] = [];
      createdIds[key].push(data.id);
    }
  }

  section("Verify counts per category");
  const expectedCounts = [
    { user: jason, category: "events", min: 2 },
    { user: jason, category: "travel", min: 2 },
    { user: jason, category: "activities", min: 2 },
    { user: jason, category: "cars", min: 2 },
    { user: sarah, category: "movies", min: 2 },
    { user: sarah, category: "homes", min: 2 },
    { user: sarah, category: "cellar", min: 2 },
    { user: sarah, category: "kids", min: 2 },
    { user: mike, category: "events", min: 1 },
    { user: mike, category: "travel", min: 1 },
  ];

  for (const ec of expectedCounts) {
    const { count, error } = await verifyCount(ec.user.client, ec.user.userId, ec.category, ec.min);
    if (error) {
      fail(`${ec.user.name} ${ec.category} count`, error.message);
    } else if (count >= ec.min) {
      pass(`${ec.user.name} ${ec.category} count`, `${count} items (expected ≥${ec.min})`);
    } else {
      fail(`${ec.user.name} ${ec.category} count`, `${count} items (expected ≥${ec.min})`);
    }
  }

  const summary = printSummary();
  return { results: getResults(), createdIds, summary };
}

const output = await run();
if (!process.env.TEST_ORCHESTRATED && output.summary.failed > 0) process.exit(1);

export default run;
