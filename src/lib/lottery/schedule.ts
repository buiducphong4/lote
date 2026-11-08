import { zonedCalendarDate, zonedTimeToIso, VN_TIME_ZONE } from "./drawTime";
import type { LotteryGameId } from "./types";

/**
 * Every game draws on a fixed weekly rhythm, so most of the time we know for certain that nothing
 * upstream can have changed. Holding an answer until the next draw is due keeps the dashboard off
 * sources that rate-limit hard, and makes a repeat visit instant instead of a fresh round of
 * network calls.
 */
export type DrawSchedule = {
  /** Draw days in the operator's own calendar, 0 = Sunday. */
  days: number[];
  hour: number;
  minute: number;
  timeZone: string;
};

/**
 * Vietlott's days and times are what Minh Ngoc's dated archive pages show; the three foreign games
 * follow their operators' published schedules, and the adapters' live `next` blocks agree.
 */
export const drawSchedules: Record<LotteryGameId, DrawSchedule> = {
  vietlott_lotto_535: { days: [0, 1, 2, 3, 4, 5, 6], hour: 13, minute: 0, timeZone: VN_TIME_ZONE },
  vietlott_power_655: { days: [2, 4, 6], hour: 18, minute: 0, timeZone: VN_TIME_ZONE },
  vietlott_mega_645: { days: [3, 5, 0], hour: 18, minute: 0, timeZone: VN_TIME_ZONE },
  us_mega_millions: { days: [2, 5], hour: 22, minute: 0, timeZone: "America/Chicago" },
  eu_euromillions: { days: [2, 5], hour: 21, minute: 30, timeZone: "Europe/Paris" },
  eu_eurojackpot: { days: [2, 5], hour: 21, minute: 0, timeZone: "Europe/Berlin" }
};

/** Results do not appear the moment the balls stop, so keep asking while a draw is landing. */
const SETTLING_TTL_MS = 3 * 60 * 1000;
/** Even a quiet stretch gets re-checked twice a day, in case an operator changes its schedule. */
const MAX_TTL_MS = 6 * 60 * 60 * 1000;
const MIN_TTL_MS = 30 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function drawAtOn(utcMs: number, schedule: DrawSchedule) {
  const { year, month, day, weekday } = zonedCalendarDate(utcMs, schedule.timeZone);
  if (!schedule.days.includes(weekday)) return null;

  const iso = zonedTimeToIso(year, month, day, schedule.hour, schedule.minute, schedule.timeZone);
  return iso ? Date.parse(iso) : null;
}

/** When the game is next drawn, as a UTC instant. */
export function nextDrawAt(gameId: LotteryGameId, from = Date.now()) {
  const schedule = drawSchedules[gameId];
  if (!schedule) return null;

  // A week of candidates is always enough for a weekly rhythm; the extra day absorbs a draw that
  // falls later today in the operator's zone than it does in ours.
  for (let offset = 0; offset <= 8; offset += 1) {
    const at = drawAtOn(from + offset * DAY_MS, schedule);
    if (at !== null && at > from) return at;
  }

  return null;
}

/** The most recent draw that should already have happened. */
export function previousDrawAt(gameId: LotteryGameId, from = Date.now()) {
  const schedule = drawSchedules[gameId];
  if (!schedule) return null;

  for (let offset = 0; offset <= 8; offset += 1) {
    const at = drawAtOn(from - offset * DAY_MS, schedule);
    if (at !== null && at <= from) return at;
  }

  return null;
}

/**
 * How long a "latest draw" answer stays good for.
 *
 * Between draws nothing can change, so hold it until the next one is due. Once a draw is due but
 * the newest result we hold predates it, the publication is still in flight: check often until the
 * data catches up.
 */
export function latestTtlMs(gameId: LotteryGameId, drawDate?: string, now = Date.now()) {
  const schedule = drawSchedules[gameId];
  if (!schedule) return MIN_TTL_MS;

  const due = previousDrawAt(gameId, now);
  if (due !== null) {
    const dueDate = zonedCalendarDate(due, schedule.timeZone).isoDate;
    if (!drawDate || drawDate < dueDate) return SETTLING_TTL_MS;
  }

  const next = nextDrawAt(gameId, now);
  if (next === null) return MAX_TTL_MS;

  return Math.min(Math.max(next - now, MIN_TTL_MS), MAX_TTL_MS);
}
