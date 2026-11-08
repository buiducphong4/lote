import { describe, expect, it } from "vitest";
import { latestTtlMs, nextDrawAt, previousDrawAt } from "./schedule";

const HOUR = 60 * 60 * 1000;
// Sunday 8 November 2026, 16:00 in Vietnam. Mega 6/45 draws at 18:00 that evening.
const sundayAfternoon = Date.parse("2026-11-08T09:00:00.000Z");
const sundayEvening = Date.parse("2026-11-08T12:00:00.000Z");

describe("draw schedules", () => {
  it("finds the next and previous Vietlott draw around draw time", () => {
    expect(new Date(nextDrawAt("vietlott_mega_645", sundayAfternoon)!).toISOString()).toBe("2026-11-08T11:00:00.000Z");
    // The one before it is Friday, two days back.
    expect(new Date(previousDrawAt("vietlott_mega_645", sundayAfternoon)!).toISOString()).toBe("2026-11-06T11:00:00.000Z");
    // An hour after the balls drop, tonight's draw is the one that has just happened.
    expect(new Date(previousDrawAt("vietlott_mega_645", sundayEvening)!).toISOString()).toBe("2026-11-08T11:00:00.000Z");
  });

  it("reads Lotto 5/35 as a daily 13:00 draw", () => {
    expect(new Date(nextDrawAt("vietlott_lotto_535", sundayEvening)!).toISOString()).toBe("2026-11-09T06:00:00.000Z");
  });

  it("follows the operator's own time zone, daylight saving included", () => {
    // Mega Millions draws Tuesday and Friday at 22:00 Central, which is UTC-6 in November.
    expect(new Date(nextDrawAt("us_mega_millions", sundayAfternoon)!).toISOString()).toBe("2026-11-11T04:00:00.000Z");
    // EuroMillions draws 21:30 in Paris, on CET at this time of year.
    expect(new Date(nextDrawAt("eu_euromillions", sundayAfternoon)!).toISOString()).toBe("2026-11-10T20:30:00.000Z");
  });
});

describe("latestTtlMs", () => {
  it("holds a current result until the next draw is due", () => {
    // Friday's result, read on Sunday afternoon: nothing can change for another two hours.
    expect(latestTtlMs("vietlott_mega_645", "2026-11-06", sundayAfternoon)).toBe(2 * HOUR);
  });

  it("keeps asking while a draw that is due has not been published", () => {
    expect(latestTtlMs("vietlott_mega_645", "2026-11-06", sundayEvening)).toBe(3 * 60 * 1000);
  });

  it("settles down again once the awaited draw arrives", () => {
    // Next up is Wednesday, nearly three days out, so the six-hour ceiling applies.
    expect(latestTtlMs("vietlott_mega_645", "2026-11-08", sundayEvening)).toBe(6 * HOUR);
  });

  it("treats a missing result as something still to come", () => {
    expect(latestTtlMs("vietlott_mega_645", undefined, sundayEvening)).toBe(3 * 60 * 1000);
  });
});
