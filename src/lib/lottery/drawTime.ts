/**
 * Lottery operators publish a draw by its own local date. EuroMillions drawing on "03/11" at 21:00
 * Paris time is already 04/11 in Vietnam, so a reader here sees a card dated yesterday for a draw
 * that has not happened. These helpers turn the operator's wall-clock time into a real instant,
 * which the UI then renders in Vietnam time.
 */

export const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Minutes a zone is offset from UTC at the given instant. */
function zoneOffsetMs(utcMs: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(new Date(utcMs));

  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  // "24" shows up at midnight in some ICU builds; Date.UTC handles the rollover either way.
  const asIfUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour") % 24, read("minute"), read("second"));

  return asIfUtc - utcMs;
}

/**
 * Resolves a wall-clock time in `timeZone` to the matching UTC instant. Two passes, because the
 * first offset is read at the wrong instant whenever the guess lands on the far side of a DST shift.
 */
export function zonedTimeToIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const corrected = guess - zoneOffsetMs(guess, timeZone);
  const instant = guess - zoneOffsetMs(corrected, timeZone);

  return Number.isFinite(instant) ? new Date(instant).toISOString() : null;
}

/** Builds the instant from an ISO date plus the operator's local draw time. */
export function drawInstant(isoDate: string, hour: number, minute: number, timeZone: string) {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  return zonedTimeToIso(Number(match[1]), Number(match[2]), Number(match[3]), hour, minute, timeZone);
}

/** "04-11 · 03:00" — compact enough for an overview card, and in the order the cards already use. */
export function formatVnShort(iso: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIME_ZONE,
    day: "2-digit",
    month: "2-digit"
  }).format(date);

  return `${day} · ${formatVnTime(date)}`;
}

/** "Thứ Tư, 04/11/2026 lúc 03:00" for the detail panel. */
export function formatVnLong(iso: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
  return `${day} lúc ${formatVnTime(date)}`;
}

function formatVnTime(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
