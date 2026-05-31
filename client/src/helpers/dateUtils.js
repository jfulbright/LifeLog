export function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return null;
  const start = formatDisplayDate(startDate);
  if (!endDate || startDate === endDate) return start;
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  if (s.getFullYear() !== e.getFullYear()) {
    return `${start} – ${formatDisplayDate(endDate)}`;
  }
  const endOpts = { month: "short", day: "numeric", year: "numeric" };
  return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", endOpts)}`;
}

export function formatMonthYear(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
