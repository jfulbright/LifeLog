// Built-in, adoptable maintenance plan templates.
//
// We deliberately ship these instead of pulling OEM schedules from an API:
// Edmunds is retiring its open API, and CarMD / VehicleDatabases are paid and
// key-gated. Most people don't follow the factory schedule line-by-line anyway —
// they want sensible interval-based reminders they can adjust. Intervals are
// conservative, widely-cited defaults; the user adopts a plan and can edit later.
//
// Each plan item: { type, intervalMiles, intervalMonths }
//   - intervalMiles:  mileage-based cadence (cars only; null when not mileage-driven)
//   - intervalMonths: time-based cadence (whichever comes first wins)

export const CAR_MAINTENANCE_TEMPLATE = [
  { type: "Oil Change", intervalMiles: 5000, intervalMonths: 6 },
  { type: "Tire Rotation", intervalMiles: 7500, intervalMonths: 6 },
  { type: "Brake Inspection", intervalMiles: 15000, intervalMonths: 12 },
  { type: "Engine Air Filter", intervalMiles: 15000, intervalMonths: 12 },
  { type: "Cabin Air Filter", intervalMiles: 15000, intervalMonths: 12 },
  { type: "Wiper Blades", intervalMiles: null, intervalMonths: 12 },
  { type: "Battery", intervalMiles: null, intervalMonths: 48 },
];

export const HOME_MAINTENANCE_TEMPLATE = [
  { type: "HVAC Filter", intervalMiles: null, intervalMonths: 3 },
  { type: "Smoke / CO Detector Batteries", intervalMiles: null, intervalMonths: 6 },
  { type: "Gutter Cleaning", intervalMiles: null, intervalMonths: 6 },
  { type: "Water Heater Flush", intervalMiles: null, intervalMonths: 12 },
  { type: "Dryer Vent Cleaning", intervalMiles: null, intervalMonths: 12 },
  { type: "HVAC Service", intervalMiles: null, intervalMonths: 12 },
  { type: "Sprinkler Winterization", intervalMiles: null, intervalMonths: 12 },
  { type: "Sprinkler System Startup", intervalMiles: null, intervalMonths: 12 },
  { type: "Backflow Preventer Test", intervalMiles: null, intervalMonths: 12 },
];

/** Returns the template array for a category, or [] if none. */
export function getTemplate(category) {
  if (category === "cars") return CAR_MAINTENANCE_TEMPLATE;
  if (category === "homes") return HOME_MAINTENANCE_TEMPLATE;
  return [];
}

/** True when the category supports maintenance tracking. */
export function supportsMaintenance(category) {
  return category === "cars" || category === "homes";
}

/** True when the category tracks mileage (drives whether mileage UI shows). */
export function tracksMileage(category) {
  return category === "cars";
}
