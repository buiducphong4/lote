import { describe, expect, it } from "vitest";
import { drawInstant, formatVnLong, formatVnShort } from "./drawTime";

describe("drawInstant", () => {
  it("reads a winter European draw as the next morning in Vietnam", () => {
    // 21:00 CET (UTC+1) on 3 November is 03:00 on 4 November in Vietnam.
    const iso = drawInstant("2026-11-03", 21, 0, "Europe/Berlin");
    expect(iso).toBe("2026-11-03T20:00:00.000Z");
    expect(formatVnShort(iso!)).toBe("04-11 · 03:00");
  });

  it("follows European summer time", () => {
    // Same wall clock in July is CEST (UTC+2), an hour earlier in UTC.
    expect(drawInstant("2026-07-03", 21, 0, "Europe/Berlin")).toBe("2026-07-03T19:00:00.000Z");
  });

  it("follows the end of US daylight saving", () => {
    // Central is UTC-5 in October and UTC-6 once DST ends on 1 November 2026.
    expect(drawInstant("2026-10-30", 22, 0, "America/Chicago")).toBe("2026-10-31T03:00:00.000Z");
    expect(drawInstant("2026-11-03", 22, 0, "America/Chicago")).toBe("2026-11-04T04:00:00.000Z");
  });

  it("rejects anything that is not an ISO date", () => {
    expect(drawInstant("03/11/2026", 21, 0, "Europe/Berlin")).toBeNull();
  });

  it("writes the long form with the weekday", () => {
    expect(formatVnLong("2026-11-03T20:00:00.000Z")).toContain("04/11/2026");
    expect(formatVnLong("2026-11-03T20:00:00.000Z")).toContain("03:00");
  });
});
