// Reminder recommendation engine. Turns a service's interval + history into a
// concrete "next reminder", and — the actually-useful part — learns from the
// user's own logged cadence so the suggestion reflects how they really drive /
// maintain, not just the factory default.
//
// Pure module (no React, no I/O) so the math is unit-tested.

import { getTemplate } from "./maintenanceTemplates";
import { getMaintenance, getServiceHistory } from "./maintenanceStatus";

const GENERIC_FALLBACK = { intervalMiles: null, intervalMonths: 12 };
const AVG_DAYS_PER_MONTH = 30.44;

// A suggestion is only worth surfacing when observed cadence diverges from the
// configured schedule beyond this noise floor.
const TUNE_MILES_TOLERANCE = 750;
const TUNE_MONTHS_TOLERANCE = 2;

function addMonths(dateStr, months) {
  if (!dateStr || !months) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  d.setMonth(d.getMonth() + months);
  return d;
}

function monthsBetween(aStr, bStr) {
  const a = new Date(aStr);
  const b = new Date(bStr);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round(Math.abs(b - a) / (AVG_DAYS_PER_MONTH * 24 * 60 * 60 * 1000));
}

function roundMiles(n) {
  if (!n) return n;
  return Math.max(500, Math.round(n / 500) * 500);
}

const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : null);

/** Factory/built-in interval for a type, or a generic yearly fallback. */
export function getDefaultInterval(category, type) {
  const t = getTemplate(category).find((i) => i.type === type);
  return t
    ? { intervalMiles: t.intervalMiles, intervalMonths: t.intervalMonths }
    : { ...GENERIC_FALLBACK };
}

/**
 * Average real-world cadence from the user's own history (needs ≥2 entries).
 * @returns {{ avgMiles: number|null, avgMonths: number|null, sampleCount: number }|null}
 */
export function getObservedCadence(log, type) {
  const history = getServiceHistory(log, type); // newest first
  if (history.length < 2) return null;
  const asc = [...history].reverse();
  const mileGaps = [];
  const monthGaps = [];
  for (let i = 1; i < asc.length; i++) {
    const prev = asc[i - 1];
    const cur = asc[i];
    const pm = Number(prev.mileage);
    const cm = Number(cur.mileage);
    if (Number.isFinite(pm) && Number.isFinite(cm) && cm - pm > 0) mileGaps.push(cm - pm);
    if (prev.date && cur.date) {
      const m = monthsBetween(prev.date, cur.date);
      if (m && m > 0) monthGaps.push(m);
    }
  }
  return { avgMiles: avg(mileGaps), avgMonths: avg(monthGaps), sampleCount: history.length };
}

/** Next-due date/mileage for a service type given an interval and its history. */
export function getNextDue(log, type, interval) {
  const last = getServiceHistory(log, type)[0] || null;
  if (!last) return { nextDate: null, nextMileage: null, lastDate: null, lastMileage: null };
  const lastMileage = Number.isFinite(Number(last.mileage)) ? Number(last.mileage) : null;
  return {
    nextDate: interval.intervalMonths ? addMonths(last.date, interval.intervalMonths) : null,
    nextMileage:
      interval.intervalMiles && lastMileage != null ? lastMileage + interval.intervalMiles : null,
    lastDate: last.date,
    lastMileage,
  };
}

/**
 * Recommend the next reminder for a service type. Prefers the user's observed
 * cadence (rounded to a sensible number), then the current plan interval, then
 * the template default.
 * @returns {{
 *   intervalMiles: number|null, intervalMonths: number|null,
 *   source: "observed"|"current"|"template",
 *   observed: object|null,
 *   nextDate: Date|null, nextMileage: number|null,
 *   lastDate: string|null, lastMileage: number|null,
 * }}
 */
export function suggestReminder(category, type, log, planItem) {
  const base = planItem
    ? { intervalMiles: planItem.intervalMiles ?? null, intervalMonths: planItem.intervalMonths ?? null }
    : getDefaultInterval(category, type);

  let { intervalMiles, intervalMonths } = base;
  let source = planItem ? "current" : "template";

  const observed = getObservedCadence(log, type);
  if (observed) {
    if (observed.avgMiles) {
      intervalMiles = roundMiles(observed.avgMiles);
      source = "observed";
    }
    if (observed.avgMonths) {
      intervalMonths = observed.avgMonths;
      source = "observed";
    }
  }

  return {
    intervalMiles,
    intervalMonths,
    source,
    observed,
    ...getNextDue(log, type, { intervalMiles, intervalMonths }),
  };
}

/**
 * Surface-worthy reminder recommendations for an item:
 *  - "tune": a scheduled item whose observed cadence differs materially from the
 *    configured interval (and the user hasn't dismissed that exact suggestion).
 *  - "add": a logged service type with no schedule yet (and not dismissed).
 * @returns {Array<{ kind: "tune"|"add", type: string, planItem: object|null, suggested: object }>}
 */
export function buildReminderSuggestions(item, category) {
  const { plan, log, dismissedReminders = [] } = getMaintenance(item);
  const dismissed = new Set(dismissedReminders);
  const out = [];

  for (const p of plan) {
    if (p.reminderOn === false) continue;
    const s = suggestReminder(category, p.type, log, p);
    if (s.source !== "observed") continue;

    const milesDiff =
      s.intervalMiles != null && p.intervalMiles != null
        ? Math.abs(s.intervalMiles - p.intervalMiles)
        : 0;
    const monthsDiff =
      s.intervalMonths != null && p.intervalMonths != null
        ? Math.abs(s.intervalMonths - p.intervalMonths)
        : 0;

    const key = `tune:${p.type}:${s.intervalMiles}:${s.intervalMonths}`;
    if (dismissed.has(key)) continue;
    if (milesDiff > TUNE_MILES_TOLERANCE || monthsDiff >= TUNE_MONTHS_TOLERANCE) {
      out.push({ kind: "tune", type: p.type, planItem: p, suggested: s });
    }
  }

  const planTypes = new Set(plan.map((p) => p.type));
  const loggedTypes = [...new Set(log.map((e) => e.type).filter(Boolean))];
  for (const type of loggedTypes) {
    if (planTypes.has(type)) continue;
    if (dismissed.has(`add:${type}`)) continue;
    out.push({ kind: "add", type, planItem: null, suggested: suggestReminder(category, type, log, null) });
  }

  return out;
}

/**
 * Active scheduled reminders with a computed next-due target, soonest first.
 * Used to show "next reminder" even when nothing is due yet.
 */
export function getUpcomingReminders(item) {
  const { plan, log } = getMaintenance(item);
  return plan
    .filter((p) => p.reminderOn !== false)
    .map((p) => {
      const next = getNextDue(log, p.type, {
        intervalMiles: p.intervalMiles,
        intervalMonths: p.intervalMonths,
      });
      return { type: p.type, planItem: p, nextDate: next.nextDate, nextMileage: next.nextMileage };
    })
    .filter((r) => r.nextDate || r.nextMileage != null)
    .sort((a, b) => {
      const ad = a.nextDate ? a.nextDate.getTime() : Infinity;
      const bd = b.nextDate ? b.nextDate.getTime() : Infinity;
      return ad - bd;
    });
}

/** Stable key used to remember a dismissed suggestion. */
export function suggestionKey(suggestion) {
  if (suggestion.kind === "add") return `add:${suggestion.type}`;
  const s = suggestion.suggested;
  return `tune:${suggestion.type}:${s.intervalMiles}:${s.intervalMonths}`;
}

/** Human-readable cadence, e.g. "5,000 mi / 6 mo" or "every 12 mo". */
export function formatInterval({ intervalMiles, intervalMonths }) {
  const parts = [];
  if (intervalMiles) parts.push(`${Number(intervalMiles).toLocaleString()} mi`);
  if (intervalMonths) parts.push(`${intervalMonths} mo`);
  return parts.length ? parts.join(" / ") : "no schedule";
}

/** Human-readable "next due" target from a suggestion/next computation. */
export function formatNext({ nextDate, nextMileage }) {
  const parts = [];
  if (nextMileage != null) parts.push(`${Number(nextMileage).toLocaleString()} mi`);
  if (nextDate) parts.push(nextDate.toISOString().slice(0, 10));
  return parts.length ? parts.join(" · ") : null;
}
