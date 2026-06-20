import { computeAgreements } from "./socialMovieStats";

// Stub the network/data modules so importing the service doesn't boot the
// Supabase client (computeAgreements is pure and uses none of them).
// jest.mock is hoisted above the import, so the real modules never load.
jest.mock("../features/movies/api/socialMovieApi", () => ({
  getSocialMovies: jest.fn(),
  computeTasteAlignment: jest.fn(),
  getSuggestedMovies: jest.fn(),
}));
jest.mock("./recommendationService", () => ({
  __esModule: true,
  default: { getMySentRecommendations: jest.fn(), getMyRecommendations: jest.fn() },
}));

// computeAgreements splits movies both the user and a circle member rated into
// agreements (ratings ≤1★ apart) and clashes (≥3★ apart), one entry per
// (movie, friend) pair. Only the user's OWN watched+rated movies count as the
// baseline; friends' ratings come from `_socialRating` (or `rating`).

const contacts = [
  { linkedUserId: "u-sarah", display_name: "Sarah", ring_level: 4 },
  { linkedUserId: "u-mike", display_name: "Mike", ring_level: 2 },
];

function mine(tmdbId, rating, extra = {}) {
  return { tmdbId, rating: String(rating), status: "watched", title: `Movie ${tmdbId}`, ...extra };
}
function theirs(tmdbId, uid, socialRating) {
  return { tmdbId, _sharedByUserId: uid, _socialRating: socialRating };
}

test("classifies close ratings as agreements and far ratings as clashes", () => {
  const myMovies = [mine("1", 5), mine("2", 5)];
  const socialMovies = [
    theirs("1", "u-sarah", 4), // |5-4| = 1 → agree
    theirs("2", "u-mike", 1), // |5-1| = 4 → clash
  ];

  const { agreed, disagreed } = computeAgreements(myMovies, socialMovies, contacts);

  expect(agreed.map((a) => a.tmdbId)).toEqual(["1"]);
  expect(agreed[0]).toMatchObject({ myRating: 5, theirRating: 4, contactName: "Sarah" });
  expect(disagreed.map((a) => a.tmdbId)).toEqual(["2"]);
  expect(disagreed[0]).toMatchObject({ myRating: 5, theirRating: 1, contactName: "Mike" });
});

test("a 2★ gap is neither an agreement nor a clash", () => {
  const { agreed, disagreed } = computeAgreements(
    [mine("1", 5)],
    [theirs("1", "u-sarah", 3)], // |5-3| = 2
    contacts
  );
  expect(agreed).toHaveLength(0);
  expect(disagreed).toHaveLength(0);
});

test("ignores movies the user has not watched+rated, and unrated friend entries", () => {
  const myMovies = [
    mine("1", 4),
    { tmdbId: "2", status: "watchlist", rating: "" }, // not watched/rated
    { tmdbId: "3", status: "watched", rating: "0" }, // rated 0
  ];
  const socialMovies = [
    theirs("1", "u-sarah", 0), // friend has no rating → skipped
    theirs("2", "u-sarah", 5), // mine not eligible → skipped
    theirs("3", "u-mike", 5), // mine rated 0 → skipped
    theirs("9", "u-mike", 5), // I never logged it → skipped
  ];
  const { agreed, disagreed } = computeAgreements(myMovies, socialMovies, contacts);
  expect(agreed).toHaveLength(0);
  expect(disagreed).toHaveLength(0);
});

test("excludes the user's shared (collaborator) entries from the baseline", () => {
  const myMovies = [{ ...mine("1", 5), _isShared: true }];
  const { agreed, disagreed } = computeAgreements(myMovies, [theirs("1", "u-sarah", 5)], contacts);
  expect(agreed).toHaveLength(0);
  expect(disagreed).toHaveLength(0);
});

test("emits one entry per movie/friend pair and falls back to 'A friend'", () => {
  const myMovies = [mine("1", 5)];
  const socialMovies = [
    theirs("1", "u-sarah", 5),
    theirs("1", "u-unknown", 5), // not in contacts → "A friend"
  ];
  const { agreed } = computeAgreements(myMovies, socialMovies, contacts);
  expect(agreed).toHaveLength(2);
  expect(agreed.map((a) => a.contactName).sort()).toEqual(["A friend", "Sarah"]);
});
