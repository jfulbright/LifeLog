import {
  getObservedCadence,
  suggestReminder,
  buildReminderSuggestions,
  getUpcomingReminders,
  getNextDue,
  suggestionKey,
  formatInterval,
} from "./maintenanceReminders";

// The recommendation engine learns from the user's logged cadence: with ≥2
// entries it derives the real interval, rounds mileage sensibly, and only
// surfaces a "tune" suggestion when that diverges from the configured schedule.

const OIL = { id: "p1", type: "Oil Change", intervalMiles: 5000, intervalMonths: 6, reminderOn: true };

describe("getObservedCadence", () => {
  it("returns null with fewer than two entries", () => {
    expect(getObservedCadence([{ type: "Oil Change", date: "2026-01-01", mileage: 10000 }], "Oil Change")).toBeNull();
  });

  it("averages mileage and month gaps across consecutive entries", () => {
    const log = [
      { type: "Oil Change", date: "2025-01-01", mileage: 10000 },
      { type: "Oil Change", date: "2025-05-01", mileage: 14000 },
      { type: "Oil Change", date: "2025-09-01", mileage: 18000 },
    ];
    const c = getObservedCadence(log, "Oil Change");
    expect(c.avgMiles).toBe(4000); // 4000 + 4000
    expect(c.avgMonths).toBe(4); // ~4 months apart
    expect(c.sampleCount).toBe(3);
  });
});

describe("suggestReminder", () => {
  it("prefers observed cadence and rounds mileage to the nearest 500", () => {
    const log = [
      { type: "Oil Change", date: "2025-01-01", mileage: 10000 },
      { type: "Oil Change", date: "2025-05-01", mileage: 14800 }, // 4800 gap → rounds to 5000
    ];
    const s = suggestReminder("cars", "Oil Change", log, OIL);
    expect(s.source).toBe("observed");
    expect(s.intervalMiles).toBe(5000);
  });

  it("falls back to the template default when there is no history and no plan item", () => {
    const s = suggestReminder("cars", "Oil Change", [], null);
    expect(s.source).toBe("template");
    expect(s.intervalMiles).toBe(5000);
    expect(s.intervalMonths).toBe(6);
  });

  it("falls back to a generic yearly interval for unknown types", () => {
    const s = suggestReminder("cars", "Coolant Flush", [], null);
    expect(s.intervalMonths).toBe(12);
    expect(s.intervalMiles).toBeNull();
  });
});

describe("getNextDue", () => {
  it("projects the next date and mileage from the last service", () => {
    const log = [{ type: "Oil Change", date: "2026-01-01", mileage: 40000 }];
    const next = getNextDue(log, "Oil Change", { intervalMiles: 5000, intervalMonths: 6 });
    expect(next.nextMileage).toBe(45000);
    expect(next.nextDate.toISOString().slice(0, 7)).toBe("2026-07");
  });
});

describe("buildReminderSuggestions", () => {
  it("suggests tuning when observed cadence differs materially from the schedule", () => {
    const item = {
      maintenance: {
        planAdopted: true,
        plan: [OIL], // configured 5000 mi
        log: [
          { type: "Oil Change", date: "2025-01-01", mileage: 10000 },
          { type: "Oil Change", date: "2025-04-01", mileage: 13000 }, // observed ~3000 mi
        ],
      },
    };
    const out = buildReminderSuggestions(item, "cars");
    const tune = out.find((s) => s.kind === "tune" && s.type === "Oil Change");
    expect(tune).toBeTruthy();
    expect(tune.suggested.intervalMiles).toBe(3000);
  });

  it("suggests adding a reminder for a logged type that has no schedule", () => {
    const item = {
      maintenance: {
        planAdopted: true,
        plan: [OIL],
        log: [{ type: "Coolant Flush", date: "2026-01-01", mileage: 40000 }],
      },
    };
    const out = buildReminderSuggestions(item, "cars");
    expect(out.some((s) => s.kind === "add" && s.type === "Coolant Flush")).toBe(true);
  });

  it("suppresses a dismissed suggestion", () => {
    const item = {
      maintenance: {
        planAdopted: true,
        plan: [OIL],
        log: [{ type: "Coolant Flush", date: "2026-01-01", mileage: 40000 }],
        dismissedReminders: ["add:Coolant Flush"],
      },
    };
    const out = buildReminderSuggestions(item, "cars");
    expect(out.some((s) => s.type === "Coolant Flush")).toBe(false);
  });

  it("does not suggest tuning when cadence matches the schedule", () => {
    const item = {
      maintenance: {
        planAdopted: true,
        plan: [OIL],
        log: [
          { type: "Oil Change", date: "2025-01-01", mileage: 10000 },
          { type: "Oil Change", date: "2025-07-01", mileage: 15000 }, // ~5000 mi / 6 mo == schedule
        ],
      },
    };
    const out = buildReminderSuggestions(item, "cars");
    expect(out.some((s) => s.kind === "tune")).toBe(false);
  });
});

describe("getUpcomingReminders", () => {
  it("returns active reminders soonest-first and skips disabled ones", () => {
    const item = {
      maintenance: {
        planAdopted: true,
        plan: [
          OIL,
          { id: "p2", type: "Wiper Blades", intervalMiles: null, intervalMonths: 12, reminderOn: false },
        ],
        log: [{ type: "Oil Change", date: "2026-01-01", mileage: 40000 }],
      },
    };
    const up = getUpcomingReminders(item);
    expect(up).toHaveLength(1);
    expect(up[0].type).toBe("Oil Change");
    expect(up[0].nextMileage).toBe(45000);
  });
});

describe("formatting + keys", () => {
  it("formats intervals and builds stable dismiss keys", () => {
    expect(formatInterval({ intervalMiles: 5000, intervalMonths: 6 })).toBe("5,000 mi / 6 mo");
    expect(formatInterval({ intervalMiles: null, intervalMonths: 12 })).toBe("12 mo");
    expect(suggestionKey({ kind: "add", type: "Coolant Flush" })).toBe("add:Coolant Flush");
  });
});
