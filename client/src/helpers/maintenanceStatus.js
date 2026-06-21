// Pure helpers for maintenance due/overdue math. No React, no I/O — unit-tested.
//
// Maintenance lives in item.data.maintenance = { planAdopted, plan[], log[] }.
// "Due" is computed from a plan item's interval + the most recent matching log
// entry. Mileage and time are both considered; whichever is reached first wins.

/** Display name for stamping who logged a service (profile → auth → fallback). */
export function resolveUserName(profile, user) {
  return (
    profile?.display_name ||
    profile?.first_name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Someone"
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 30; // within a month of the time-based due date
const DUE_SOON_MILES = 500; // within 500 mi of the mileage-based due point

/** Reads the maintenance object off an item, tolerating missing/legacy shapes. */
export function getMaintenance(item) {
  // App items are flat (rowToItem spreads ...row.data), so maintenance lives at
  // item.maintenance; tolerate item.data.maintenance for any raw-row callers.
  const m = item?.maintenance || item?.data?.maintenance || {};
  return {
    planAdopted: !!m.planAdopted,
    plan: Array.isArray(m.plan) ? m.plan : [],
    log: Array.isArray(m.log) ? m.log : [],
  };
}

/** Log entries for a service type, newest first. */
export function getServiceHistory(log, type) {
  return (log || [])
    .filter((e) => e && e.type === type)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

/** Most recent log entry for a type, or null. */
export function getLastService(log, type) {
  return getServiceHistory(log, type)[0] || null;
}

/** Best estimate of the vehicle's current odometer: the highest mileage logged. */
export function getCurrentMileage(log) {
  return (log || []).reduce((max, e) => {
    const m = Number(e?.mileage);
    return Number.isFinite(m) && m > max ? m : max;
  }, 0);
}

function addMonths(dateStr, months) {
  if (!dateStr || !months) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Due status for a single plan item.
 * @returns {{
 *   status: "no-history"|"ok"|"due-soon"|"overdue",
 *   lastDate: string|null,
 *   lastMileage: number|null,
 *   dueDate: Date|null,
 *   dueMileage: number|null,
 * }}
 */
export function computeDueStatus(planItem, log, currentMileage, now = new Date()) {
  const last = getLastService(log, planItem.type);

  if (!last) {
    return { status: "no-history", lastDate: null, lastMileage: null, dueDate: null, dueMileage: null };
  }

  const dueDate = addMonths(last.date, planItem.intervalMonths);
  const lastMileage = Number.isFinite(Number(last.mileage)) ? Number(last.mileage) : null;
  const dueMileage =
    planItem.intervalMiles && lastMileage != null ? lastMileage + planItem.intervalMiles : null;

  let overdue = false;
  let dueSoon = false;

  if (dueDate) {
    const daysLeft = (dueDate.getTime() - now.getTime()) / DAY_MS;
    if (daysLeft <= 0) overdue = true;
    else if (daysLeft <= DUE_SOON_DAYS) dueSoon = true;
  }

  if (dueMileage != null) {
    const milesLeft = dueMileage - currentMileage;
    if (milesLeft <= 0) overdue = true;
    else if (milesLeft <= DUE_SOON_MILES) dueSoon = true;
  }

  const status = overdue ? "overdue" : dueSoon ? "due-soon" : "ok";
  return { status, lastDate: last.date, lastMileage, dueDate, dueMileage };
}

/**
 * Card/summary roll-up across the whole plan.
 * @returns {{
 *   adopted: boolean,
 *   overdueCount: number,
 *   dueSoonCount: number,
 *   logCount: number,
 *   lastService: object|null,
 * }}
 */
export function summarizeMaintenance(item, now = new Date()) {
  const { planAdopted, plan, log } = getMaintenance(item);
  const currentMileage = getCurrentMileage(log);

  let overdueCount = 0;
  let dueSoonCount = 0;
  for (const planItem of plan) {
    const { status } = computeDueStatus(planItem, log, currentMileage, now);
    if (status === "overdue") overdueCount += 1;
    else if (status === "due-soon") dueSoonCount += 1;
  }

  const lastService =
    [...log].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0] || null;

  return {
    adopted: planAdopted,
    overdueCount,
    dueSoonCount,
    logCount: log.length,
    lastService,
  };
}
