import { randomUUID } from "crypto";

let counter = 0;
function seq() { return ++counter; }

export async function insertItem(client, userId, item) {
  const id = randomUUID();
  const { data, error } = await client
    .from("items")
    .insert({ id, user_id: userId, category: item.category, status: item.status, start_date: item.start_date || null, data: { ...item.data, id } })
    .select()
    .single();
  return { data, error };
}

export function makeEvent(overrides = {}) {
  const n = seq();
  return {
    category: "events",
    status: "attended",
    start_date: "2025-06-15",
    data: {
      title: `Test Concert ${n}`,
      eventType: "concert",
      artist: `Artist ${n}`,
      venue: `Venue ${n}`,
      city: "Austin",
      country: "US",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeEventWishlist(overrides = {}) {
  const n = seq();
  return {
    category: "events",
    status: "wishlist",
    data: {
      title: `Wishlist Event ${n}`,
      eventType: "sports",
      teams: "Team A vs Team B",
      city: "Dallas",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeTravel(overrides = {}) {
  const n = seq();
  return {
    category: "travel",
    status: "visited",
    start_date: "2025-03-01",
    data: {
      title: `Trip to Place ${n}`,
      city: "Paris",
      country: "France",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeTravelWishlist(overrides = {}) {
  const n = seq();
  return {
    category: "travel",
    status: "wishlist",
    data: {
      title: `Dream Trip ${n}`,
      city: "Tokyo",
      country: "Japan",
      wishlistReason: "Always wanted to visit",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeActivity(overrides = {}) {
  const n = seq();
  return {
    category: "activities",
    status: "done",
    start_date: "2025-04-10",
    data: {
      title: `Activity ${n}`,
      activityType: "skiing",
      city: "Vail",
      difficulty: "intermediate",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeActivityWishlist(overrides = {}) {
  const n = seq();
  return {
    category: "activities",
    status: "wishlist",
    data: {
      title: `Bucket List Activity ${n}`,
      activityType: "surfing",
      city: "Maui",
      wishlistReason: "Looks amazing",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeMovie(overrides = {}) {
  const n = seq();
  return {
    category: "movies",
    status: "watched",
    start_date: "2025-05-20",
    data: {
      title: `Movie ${n}`,
      director: `Director ${n}`,
      year: 2025,
      genre: "Drama",
      rating: 4,
      visibilityRings: [1, 2, 3, 4],
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeMovieWatchlist(overrides = {}) {
  const n = seq();
  return {
    category: "movies",
    status: "watchlist",
    data: {
      title: `Watchlist Movie ${n}`,
      director: `Director ${n}`,
      year: 2025,
      genre: "Sci-Fi",
      visibilityRings: [1, 2, 3, 4],
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeMovieRecommended(recommenders = [], overrides = {}) {
  const n = seq();
  const { data: dataOverrides, ...rest } = overrides;
  return {
    category: "movies",
    status: "watchlist",
    data: {
      title: `Recommended Movie ${n}`,
      director: `Director ${n}`,
      year: 2025,
      genre: "Drama",
      visibilityRings: [1, 2, 3, 4],
      recommendedBy: recommenders,
      ...dataOverrides,
    },
    ...rest,
  };
}

export function makeCellarWine(overrides = {}) {
  const n = seq();
  return {
    category: "cellar",
    status: "tried",
    start_date: "2025-02-14",
    data: {
      title: `Wine ${n}`,
      subType: "wine",
      winery: `Winery ${n}`,
      vintage: 2020,
      wineType: "Red",
      varietal: "Cabernet Sauvignon",
      rating: 4,
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeCellarWhiskey(overrides = {}) {
  const n = seq();
  return {
    category: "cellar",
    status: "cellar",
    data: {
      title: `Whiskey ${n}`,
      subType: "whiskey",
      distillery: `Distillery ${n}`,
      whiskeyType: "Bourbon",
      ageStatement: "12 Years",
      abv: "46%",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeCar(overrides = {}) {
  const n = seq();
  return {
    category: "cars",
    status: "owned",
    data: {
      title: `Car ${n}`,
      make: "Toyota",
      model: "4Runner",
      year: 2022,
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeCarWishlist(overrides = {}) {
  const n = seq();
  return {
    category: "cars",
    status: "wishlist",
    data: {
      title: `Dream Car ${n}`,
      make: "Porsche",
      model: "911",
      year: 2025,
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeHome(overrides = {}) {
  const n = seq();
  return {
    category: "homes",
    status: "owned",
    data: {
      title: `Home ${n}`,
      homeType: "House",
      city: "Austin",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2500,
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeHomeRented(overrides = {}) {
  const n = seq();
  return {
    category: "homes",
    status: "rented",
    data: {
      title: `Rental ${n}`,
      homeType: "Apartment",
      city: "New York",
      monthlyRent: 3500,
      bedrooms: 2,
      bathrooms: 1,
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeKid(overrides = {}) {
  const n = seq();
  return {
    category: "kids",
    status: "happened",
    start_date: "2025-05-01",
    data: {
      title: `Milestone ${n}`,
      milestoneType: "school",
      schoolEvent: "Graduation",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function makeKidUpcoming(overrides = {}) {
  const n = seq();
  return {
    category: "kids",
    status: "upcoming",
    data: {
      title: `Upcoming Milestone ${n}`,
      milestoneType: "sports",
      sport: "Soccer",
      event: "Championship game",
      ...overrides.data,
    },
    ...overrides,
  };
}

export function resetCounter() {
  counter = 0;
}
