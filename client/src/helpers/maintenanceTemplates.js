// Built-in, adoptable maintenance plan templates.
//
// We deliberately ship these instead of pulling OEM schedules from an API:
// Edmunds is retiring its open API, and CarMD / VehicleDatabases are paid and
// key-gated. Most people don't follow the factory schedule line-by-line anyway —
// they want sensible interval-based reminders they can adjust. Intervals are
// conservative, widely-cited defaults; the user adopts a plan and can edit later.
//
// Each plan item: { type, intervalMiles, intervalMonths, notes }
//   - intervalMiles:  mileage-based cadence (cars only; null when not mileage-driven)
//   - intervalMonths: time-based cadence (whichever comes first wins)
//   - notes:          optional user-visible guidance string

// Sources: AAA Car Care Guide, Car and Driver, Consumer Reports, OEM manuals (Toyota/Honda/Ford/GM/BMW)
export const CAR_MAINTENANCE_TEMPLATE = [
  // Conventional oil: 3,000–5,000 mi. Full synthetic: 7,500–10,000 mi (OEM consensus).
  // Default 5,000 mi / 6 mo covers both; owners on synthetic can raise to 7,500–10,000.
  { type: "Oil Change", intervalMiles: 5000, intervalMonths: 6, notes: "Synthetic oil can extend to 7,500–10,000 mi — check your owner's manual or oil life monitor." },
  // AAA and Consumer Reports: every 5,000–8,000 mi; 7,500 is the widely cited midpoint.
  { type: "Tire Rotation", intervalMiles: 7500, intervalMonths: 6 },
  // Car and Driver / Consumer Reports: inspect every 12,000–15,000 mi; replace pads ~25,000–65,000 mi depending on driving style.
  { type: "Brake Inspection", intervalMiles: 15000, intervalMonths: 12 },
  // OEM range: 15,000–30,000 mi. 15,000 mi is conservative and appropriate for dusty/high-pollen climates.
  { type: "Engine Air Filter", intervalMiles: 15000, intervalMonths: 12 },
  { type: "Cabin Air Filter", intervalMiles: 15000, intervalMonths: 12 },
  // Wipers degrade from UV/use regardless of mileage; 12 mo is the AAA-recommended default.
  { type: "Wiper Blades", intervalMiles: null, intervalMonths: 12 },
  // Most OEMs rate batteries at 3–5 years; 48 mo is a conservative midpoint.
  { type: "Battery", intervalMiles: null, intervalMonths: 48 },
  // Coolant: OEM range 2–5 years; 30 mo is a safe midpoint for older conventional coolant.
  // Modern OAT/HOAT coolant can last 5 years — owner's manual is authoritative.
  { type: "Coolant Flush", intervalMiles: 30000, intervalMonths: 30, notes: "Interval varies widely by coolant type — check your owner's manual." },
  // Transmission fluid: OEM range 30,000–60,000 mi for conventional; 60,000–100,000 mi for synthetics.
  // 30,000 mi is conservative and safe for vehicles without a drain plug (lifetime fluid claim notwithstanding).
  { type: "Transmission Fluid", intervalMiles: 30000, intervalMonths: 36, notes: "Some manufacturers claim 'lifetime' fluid — many mechanics recommend changing every 30,000–60,000 mi regardless." },
  // Spark plugs: standard copper 30,000 mi; iridium/platinum 60,000–100,000 mi. 60,000 mi covers both types.
  { type: "Spark Plugs", intervalMiles: 60000, intervalMonths: 60, notes: "Iridium/platinum plugs can last 60,000–100,000 mi; copper plugs typically 30,000 mi." },
];

// Sources: ASHI (American Society of Home Inspectors) seasonal checklists,
// EPA/ENERGY STAR HVAC guidance, manufacturer recommendations.
export const HOME_MAINTENANCE_TEMPLATE = [
  // EPA/ENERGY STAR: 1–3 mo depending on filter type (MERV rating) and pets/allergies.
  // 3 mo is appropriate for standard 1-inch filters; high-MERV or pet-owner households should use 1–2 mo.
  { type: "HVAC Filter", intervalMiles: null, intervalMonths: 3, notes: "1–2 months if you have pets or allergies, or use a high-MERV filter." },
  // NFPA 72 / manufacturer recommendation: test monthly, replace batteries annually.
  { type: "Smoke / CO Detector Batteries", intervalMiles: null, intervalMonths: 6 },
  // ASHI: spring and fall cleanings for areas with heavy tree coverage; fall-only for lighter coverage.
  { type: "Gutter Cleaning", intervalMiles: null, intervalMonths: 6, notes: "Clean in spring and fall if you have heavy tree coverage nearby." },
  // DOE and water heater manufacturers recommend flushing annually to remove sediment.
  { type: "Water Heater Flush", intervalMiles: null, intervalMonths: 12 },
  // U.S. Fire Administration: clean dryer vent at least once a year to prevent fires.
  { type: "Dryer Vent Cleaning", intervalMiles: null, intervalMonths: 12 },
  // ENERGY STAR: professional HVAC tune-up once a year (heating in fall, cooling in spring).
  { type: "HVAC Service", intervalMiles: null, intervalMonths: 12 },
  // ASHI seasonal checklist: blow out irrigation lines before first hard freeze (fall).
  { type: "Sprinkler Winterization", intervalMiles: null, intervalMonths: 12 },
  // ASHI seasonal checklist: inspect and restart irrigation system in spring.
  { type: "Sprinkler System Startup", intervalMiles: null, intervalMonths: 12 },
  // Most municipalities require annual backflow preventer test by a certified tester.
  { type: "Backflow Preventer Test", intervalMiles: null, intervalMonths: 12 },
  // Water heater manufacturers: inspect anode rod every 3–5 years; replace when less than ½ inch core remains.
  { type: "Water Heater Anode Rod", intervalMiles: null, intervalMonths: 36, notes: "Inspect every 3 years; replace if the rod is heavily corroded or under ½ inch in diameter." },
  // ASHI: roof inspection every 3–5 years, or after major storms. 36 mo is a safe default.
  { type: "Roof Inspection", intervalMiles: null, intervalMonths: 36, notes: "Also inspect after hail storms or high winds." },
  // Paint manufacturers (Sherwin-Williams, Benjamin Moore): exterior repaint every 5–7 years for wood siding.
  // Fiber cement / vinyl siding can go longer; brick/stucco rarely needs full repaints.
  { type: "Exterior Paint", intervalMiles: null, intervalMonths: 60, notes: "5–7 years for wood siding; fiber cement and vinyl typically last longer." },
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
