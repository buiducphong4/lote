import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyText } from "./money";
import { toNetMoney } from "./tax";

describe("tax helpers", () => {
  it("keeps the million scale when estimating a Mega Millions net prize", () => {
    const jackpot = parseMoneyText("$489 Million", "USD");
    expect(jackpot).toEqual({ amount: 489_000_000, currency: "USD" });

    const net = toNetMoney(jackpot, "us_mega_millions");
    expect(net?.amount).toBeCloseTo(146_700_000, 0);
    expect(formatMoney(net)).toBe("$146,7M");
  });

  it("applies the EuroMillions net rate in euros", () => {
    const jackpot = parseMoneyText("€60,301,678", "EUR");
    expect(jackpot).toEqual({ amount: 60_301_678, currency: "EUR" });

    const net = toNetMoney(jackpot, "eu_euromillions");
    expect(net?.amount).toBeCloseTo(48_241_342.4, 1);
  });

  it("keeps a Vietlott jackpot in dong", () => {
    const jackpot = parseMoneyText("52.480.386.000 VND", "VND");
    expect(jackpot).toEqual({ amount: 52_480_386_000, currency: "VND" });

    const net = toNetMoney(jackpot, "vietlott_power_655");
    expect(net?.amount).toBeCloseTo(47_232_347_400, 0);
  });

  it("returns null for a missing prize instead of a placeholder string", () => {
    expect(toNetMoney(null, "vietlott_mega_645")).toBeNull();
    expect(formatMoney(null)).toBe("—");
  });
});
