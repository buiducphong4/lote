import { getCached } from "./cache";
import { fetchWithTimeout } from "./fetcher";
import { CURRENCIES, type CurrencyCode } from "./money";

export type FxRates = {
  /** Units of each currency per 1 USD. */
  base: "USD";
  rates: Record<CurrencyCode, number>;
  fetchedAt: string;
  sourceName: string;
  sourceUrl: string;
  /** True when every live provider failed and the baked-in rates are in use. */
  stale: boolean;
};

const FX_TTL = 6 * 60 * 60 * 1000;

const primaryUrl = "https://open.er-api.com/v6/latest/USD";
const fallbackUrl = "https://api.frankfurter.dev/v1/latest?base=USD";

/**
 * Last-resort rates so prize conversion still renders when every provider is
 * unreachable. Flagged as `stale` in the UI whenever these are used.
 */
const OFFLINE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.88,
  VND: 26_000
};

export function getFxRates(): Promise<FxRates> {
  return getCached("fx:usd", FX_TTL, loadFxRates);
}

async function loadFxRates(): Promise<FxRates> {
  try {
    return await fetchOpenErApi();
  } catch {
    // Fall through to the ECB-backed provider.
  }

  try {
    return await fetchFrankfurter();
  } catch {
    return {
      base: "USD",
      rates: OFFLINE_RATES,
      fetchedAt: new Date().toISOString(),
      sourceName: "Tỷ giá dự phòng ngoại tuyến",
      sourceUrl: primaryUrl,
      stale: true
    };
  }
}

async function fetchOpenErApi(): Promise<FxRates> {
  const response = await fetchWithTimeout(primaryUrl, { headers: { Accept: "application/json" } });
  const payload = (await response.json()) as {
    result?: string;
    rates?: Record<string, unknown>;
    time_last_update_utc?: string;
  };

  if (payload.result !== "success") {
    throw new Error("open.er-api.com did not return a successful result.");
  }

  return {
    base: "USD",
    rates: readRates(payload.rates),
    fetchedAt: toIsoOrNow(payload.time_last_update_utc),
    sourceName: "exchangerate-api.com",
    sourceUrl: primaryUrl,
    stale: false
  };
}

async function fetchFrankfurter(): Promise<FxRates> {
  const response = await fetchWithTimeout(fallbackUrl, { headers: { Accept: "application/json" } });
  const payload = (await response.json()) as { rates?: Record<string, unknown>; date?: string };

  // Frankfurter tracks ECB reference rates, which do not include VND.
  const rates = readRates({ ...payload.rates, VND: payload.rates?.VND ?? OFFLINE_RATES.VND });

  return {
    base: "USD",
    rates,
    fetchedAt: toIsoOrNow(payload.date),
    sourceName: "Frankfurter (ECB)",
    sourceUrl: fallbackUrl,
    stale: !payload.rates?.VND
  };
}

function readRates(raw: Record<string, unknown> | undefined): Record<CurrencyCode, number> {
  const rates = { ...OFFLINE_RATES };

  for (const currency of CURRENCIES) {
    const value = Number(raw?.[currency]);
    if (Number.isFinite(value) && value > 0) {
      rates[currency] = value;
    }
  }

  rates.USD = 1;
  return rates;
}

function toIsoOrNow(value: string | undefined) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}
