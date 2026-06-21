import {
  getLastService,
  getCurrentMileage,
  computeDueStatus,
  summarizeMaintenance,
  getMaintenance,
} from "./maintenanceStatus";

// computeDueStatus is pure: given a plan item (interval in miles/months), the
// service log, and the current odometer, it classifies a service as
// no-history / ok / due-soon / overdue. Time and mileage both count; whichever
// threshold is crossed first wins.

const NOW = new Date("2026-06-20T00:00:00Z");

const OIL = { type: "Oil Change", intervalMiles: 5000, intervalMonths: 6 };
const WIPERS = { type: "Wiper Blades", intervalMiles: null, intervalMonths: 12 };

function log(...entries) {
  return entries;
}

describe("getMaintenance", () => {
  it("reads flat item.maintenance and defaults missing shapes", () => {
    expect(getMaintenance({ maintenance: { planAdopted: true, plan: [OIL], log: [] } })).toEqual({
      planAdopted: true,
      plan: [OIL],
      log: [],
    });
    expect(getMaintenance({})).toEqual({ planAdopted: false, plan: [], log: [] });
  });
});

describe("getLastService / getCurrentMileage", () => {
  it("returns the newest entry of a type", () => {
    const l = log(
      { type: "Oil Change", date: "2025-01-01", mileage: 30000 },
      { type: "Oil Change", date: "2026-01-01", mileage: 42000 },
      { type: "Tire Rotation", date: "2026-03-01", mileage: 44000 }
    );
    expect(getLastService(l, "Oil Change").mileage).toBe(42000);
    expect(getCurrentMileage(l)).toBe(44000);
  });

  it("handles an empty log", () => {
    expect(getLastService([], "Oil Change")).toBeNull();
    expect(getCurrentMileage([])).toBe(0);
  });
});

describe("computeDueStatus", () => {
  it("reports no-history when the service was never logged", () => {
    expect(computeDueStatus(OIL, [], 0, NOW).status).toBe("no-history");
  });

  it("is ok when well within both thresholds", () => {
    // 1 month ago, 1000 miles ago → far from 6mo / 5000mi
    const l = log({ type: "Oil Change", date: "2026-05-20", mileage: 49000 });
    expect(computeDueStatus(OIL, l, 50000, NOW).status).toBe("ok");
  });

  it("is overdue when the mileage interval is exceeded", () => {
    const l = log({ type: "Oil Change", date: "2026-05-20", mileage: 49000 });
    // current 54500 → 5500 since last, > 5000
    expect(computeDueStatus(OIL, l, 54500, NOW).status).toBe("overdue");
  });

  it("is overdue when the time interval is exceeded even with low mileage", () => {
    const l = log({ type: "Oil Change", date: "2025-06-20", mileage: 49000 });
    // 12 months elapsed > 6mo, mileage barely moved
    expect(computeDueStatus(OIL, l, 49500, NOW).status).toBe("overdue");
  });

  it("is due-soon within the mileage window", () => {
    const l = log({ type: "Oil Change", date: "2026-06-01", mileage: 49000 });
    // due at 54000, current 53800 → 200 miles left (< 500)
    expect(computeDueStatus(OIL, l, 53800, NOW).status).toBe("due-soon");
  });

  it("is due-soon within the time window for a time-only item", () => {
    // wipers: 12mo only. last 11.5 months ago → ~15 days left
    const l = log({ type: "Wiper Blades", date: "2025-07-05", mileage: null });
    expect(computeDueStatus(WIPERS, l, 0, NOW).status).toBe("due-soon");
  });
});

describe("summarizeMaintenance", () => {
  it("rolls up overdue/due-soon counts and the latest service", () => {
    const item = {
      maintenance: {
        planAdopted: true,
        plan: [OIL, WIPERS],
        log: [
          { type: "Oil Change", date: "2025-06-20", mileage: 49000 }, // overdue (12mo)
          { type: "Wiper Blades", date: "2026-06-01", mileage: null }, // ok
        ],
      },
    };
    const s = summarizeMaintenance(item, NOW);
    expect(s.adopted).toBe(true);
    expect(s.overdueCount).toBe(1);
    expect(s.dueSoonCount).toBe(0);
    expect(s.logCount).toBe(2);
    expect(s.lastService.type).toBe("Wiper Blades");
  });

  it("is inert for an unadopted item", () => {
    const s = summarizeMaintenance({}, NOW);
    expect(s).toEqual({ adopted: false, overdueCount: 0, dueSoonCount: 0, logCount: 0, lastService: null });
  });
});
