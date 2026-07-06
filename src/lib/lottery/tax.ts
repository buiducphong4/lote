import type { LotteryDraw, LotteryGameId } from "./types";

const NET_RATES: Record<LotteryGameId, number> = {
  vietlott_lotto_535: 0.9,
  vietlott_power_655: 0.9,
  vietlott_mega_645: 0.9,
  eu_euromillions: 0.8,
  eu_eurojackpot: 0.8,
  us_mega_millions: 0.3
};

export function getNetRate(gameId: LotteryGameId) {
  return NET_RATES[gameId];
}

export function formatNetPrize(value: string | number | null | undefined, draw: Pick<LotteryDraw, "gameId" | "region">) {
  const parsed = parseMoney(value);
  if (!parsed) return "Chua co";

  const net = parsed.amount * getNetRate(draw.gameId);
  return formatMoney(net, parsed.currency, draw.region);
}

function parseMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return { amount: value, currency: "" };
  }

  const upper = value.toUpperCase();
  const currency = upper.includes("VN") || upper.includes("Đ") ? "VND" : upper.includes("$") ? "USD" : upper.includes("€") ? "EUR" : "";
  const multiplier = moneyScale(upper);
  const numericText = value.replace(/[^\d.,-]/g, "");
  if (!numericText) return null;

  const amount = parseLocalizedNumber(numericText) * multiplier;
  if (!Number.isFinite(amount)) return null;

  return { amount, currency };
}

function moneyScale(value: string) {
  if (value.includes("BILLION") || value.includes("BIL.")) return 1_000_000_000;
  if (value.includes("MILLION") || value.includes("MIL.")) return 1_000_000;
  if (value.includes("THOUSAND") || value.includes("K")) return 1_000;
  return 1;
}

function parseLocalizedNumber(value: string) {
  const hasComma = value.includes(",");
  const hasDot = value.includes(".");

  if (hasComma && hasDot) {
    const lastComma = value.lastIndexOf(",");
    const lastDot = value.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    return Number(value.replaceAll(thousandsSeparator, "").replace(decimalSeparator, "."));
  }

  if (hasDot) {
    const parts = value.split(".");
    if (parts.length > 1 && parts.at(-1)?.length === 3) {
      return Number(value.replaceAll(".", ""));
    }
  }

  if (hasComma) {
    const parts = value.split(",");
    if (parts.length > 1 && parts.at(-1)?.length === 3) {
      return Number(value.replaceAll(",", ""));
    }
    return Number(value.replace(",", "."));
  }

  return Number(value);
}

function formatMoney(amount: number, currency: string, region: LotteryDraw["region"]) {
  if (currency === "VND" || region === "VN") {
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount)} VND`;
  }

  if (currency === "USD" || region === "US") {
    return formatCompactUsd(amount);
  }

  if (currency === "EUR" || region === "EU") {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
  }

  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(amount);
}

function formatCompactUsd(amount: number) {
  if (amount >= 1_000_000_000) {
    return `$${trimTrailingZeros(amount / 1_000_000_000)} Billion`;
  }

  if (amount >= 1_000_000) {
    return `$${trimTrailingZeros(amount / 1_000_000)} Million`;
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function trimTrailingZeros(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}
