import eventSchema from "../features/events/eventSchema";
import travelSchema from "../features/travel/travelSchema";
import carSchema from "../features/cars/carSchema";
import homeSchema from "../features/homes/homeSchema";
import activitySchema from "../features/activities/activitySchema";
import cellarSchema from "../features/cellar/cellarSchema";
import kidsSchema from "../features/kids/kidsSchema";
import movieSchema from "../features/movies/movieSchema";

export const SCHEMA_MAP = {
  events: eventSchema,
  travel: travelSchema,
  cars: carSchema,
  homes: homeSchema,
  activities: activitySchema,
  cellar: cellarSchema,
  kids: kidsSchema,
  movies: movieSchema,
};

export const CATEGORY_KEYS = ["events", "travel", "activities", "movies", "cellar", "cars", "homes", "kids"];
