import { describe, expect, it } from "vitest";
import { formatNetPrize } from "./tax";

describe("tax helpers", () => {
  it("keeps Mega Millions million scale when estimating net prize", () => {
    expect(formatNetPrize("$489 Million", { gameId: "us_mega_millions", region: "US" })).toBe("$146.7 Million");
  });

  it("formats EuroMillions net prize with euro currency", () => {
    expect(formatNetPrize("€60,301,678", { gameId: "eu_euromillions", region: "EU" })).toBe("€48,241,342");
  });
});
