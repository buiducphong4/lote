import { describe, expect, it } from "vitest";
import { convertMoney, formatMoney, money, parseMoneyText, type CurrencyCode } from "./money";

const rates: Record<CurrencyCode, number> = { USD: 1, EUR: 0.88, VND: 26_000 };

describe("parseMoneyText", () => {
  it("reads Vietnamese dot-grouped amounts", () => {
    expect(parseMoneyText("52.480.386.000 VND", "VND")).toEqual({ amount: 52_480_386_000, currency: "VND" });
  });

  it("reads comma-grouped amounts with a decimal part", () => {
    expect(parseMoneyText("$1,234,567.89", "USD")).toEqual({ amount: 1_234_567.89, currency: "USD" });
  });

  it("reads European grouping where the comma is the decimal separator", () => {
    expect(parseMoneyText("1.234.567,89 €", "EUR")).toEqual({ amount: 1_234_567.89, currency: "EUR" });
  });

  it("applies scale words", () => {
    expect(parseMoneyText("$489 Million", "USD")?.amount).toBe(489_000_000);
    expect(parseMoneyText("1.5 Billion USD", "USD")?.amount).toBe(1_500_000_000);
    expect(parseMoneyText("12 tỷ", "VND")?.amount).toBe(12_000_000_000);
  });

  it("detects the currency from the symbol and overrides the fallback", () => {
    expect(parseMoneyText("€60,301,678", "USD")?.currency).toBe("EUR");
    expect(parseMoneyText("₫1.000.000", "USD")?.currency).toBe("VND");
  });

  it("rejects empty, zero and non-numeric input", () => {
    expect(parseMoneyText(null, "VND")).toBeNull();
    expect(parseMoneyText("", "VND")).toBeNull();
    expect(parseMoneyText("Roll", "USD")).toBeNull();
    expect(parseMoneyText("0 VND", "VND")).toBeNull();
  });
});

describe("convertMoney", () => {
  it("returns the same object when no conversion is needed", () => {
    const value = money(100, "USD")!;
    expect(convertMoney(value, "USD", rates)).toBe(value);
  });

  it("converts through the USD base", () => {
    expect(convertMoney(money(100, "USD")!, "VND", rates)).toEqual({ amount: 2_600_000, currency: "VND" });
    expect(convertMoney(money(88, "EUR")!, "USD", rates)).toEqual({ amount: 100, currency: "USD" });
  });

  it("round trips without drift", () => {
    const eur = convertMoney(money(26_000, "VND")!, "EUR", rates)!;
    expect(convertMoney(eur, "VND", rates)?.amount).toBeCloseTo(26_000, 6);
  });
});

describe("formatMoney", () => {
  it("uses Vietnamese scale words for dong", () => {
    expect(formatMoney(money(52_480_386_000, "VND"))).toBe("52,5 tỷ ₫");
    expect(formatMoney(money(3_200_000, "VND"))).toBe("3,2 triệu ₫");
  });

  it("uses M and B suffixes for western currencies", () => {
    expect(formatMoney(money(489_000_000, "USD"))).toBe("$489M");
    expect(formatMoney(money(1_250_000_000, "USD"))).toBe("$1,3B");
  });

  it("falls back to an exact figure below one million", () => {
    expect(formatMoney(money(2_500, "USD"))).toBe("$2.500");
  });
});
