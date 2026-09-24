export const CURRENCIES = ["VND", "USD", "EUR"] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

/** A prize amount kept as a number plus its currency, never as pre-formatted text. */
export type Money = {
  amount: number;
  currency: CurrencyCode;
};

export type CurrencyPreference = CurrencyCode | "native";

export const CURRENCY_META: Record<CurrencyCode, { label: string; symbol: string }> = {
  VND: { label: "Việt Nam Đồng", symbol: "₫" },
  USD: { label: "US Dollar", symbol: "$" },
  EUR: { label: "Euro", symbol: "€" }
};

/**
 * Every amount is grouped the Vietnamese way regardless of currency, so a card
 * showing `$261M` next to `6,8 nghìn tỷ ₫` does not mix decimal separators.
 */
const LOCALE = "vi-VN";

export function money(amount: number, currency: CurrencyCode): Money | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount, currency };
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

export function isCurrencyPreference(value: unknown): value is CurrencyPreference {
  return value === "native" || isCurrencyCode(value);
}

/**
 * Parses money out of the free-form text that lottery sources publish, e.g.
 * `"1.234.567 VND"`, `"$489 Million"`, `"€60,301,678"` or `"12,5 Mio."`.
 */
export function parseMoneyText(value: string | number | null | undefined, fallbackCurrency: CurrencyCode): Money | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return money(value, fallbackCurrency);

  const numericText = value.replace(/[^\d.,]/g, "");
  if (!numericText) return null;

  const amount = parseLocalizedNumber(numericText) * readScale(value);
  return money(amount, readCurrency(value) ?? fallbackCurrency);
}

function readCurrency(value: string): CurrencyCode | null {
  const upper = value.toUpperCase();
  if (upper.includes("VND") || value.includes("₫") || upper.includes("ĐỒNG") || upper.includes("DONG")) return "VND";
  if (value.includes("€") || upper.includes("EUR")) return "EUR";
  if (value.includes("$") || upper.includes("USD")) return "USD";
  return null;
}

/**
 * Diacritics are folded first because JavaScript's `\b` is ASCII-only, so a
 * pattern like `\bTỶ\b` would never match the accented source text.
 */
function readScale(value: string) {
  const folded = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();

  if (/\b(NGHIN TY|TRILLION)\b/.test(folded)) return 1_000_000_000_000;
  if (/\b(BILLION|BIL|TY)\b/.test(folded)) return 1_000_000_000;
  if (/\b(MILLION|MILLIONEN|MIO|MIL|TRIEU)\b/.test(folded)) return 1_000_000;
  if (/\b(THOUSAND|NGHIN|K)\b/.test(folded)) return 1_000;
  return 1;
}

/**
 * Decides which of `.` and `,` is the decimal separator before parsing, so both
 * `1,234,567.89` (en) and `1.234.567,89` (vi/de) survive the round trip.
 */
function parseLocalizedNumber(value: string) {
  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    return Number(value.replaceAll(thousands, "").replace(decimal, "."));
  }

  const separator = lastComma >= 0 ? "," : lastDot >= 0 ? "." : null;
  if (!separator) return Number(value);

  const groups = value.split(separator);
  // Three trailing digits after a single separator reads as a thousands group.
  const isThousands = groups.length > 2 || groups.at(-1)?.length === 3;
  return Number(isThousands ? value.replaceAll(separator, "") : value.replace(separator, "."));
}

export function convertMoney(value: Money, target: CurrencyCode, rates: Record<CurrencyCode, number>): Money | null {
  if (value.currency === target) return value;

  const from = rates[value.currency];
  const to = rates[target];
  if (!from || !to) return null;

  return money((value.amount / from) * to, target);
}

export type FormatMoneyOptions = {
  /** Shortens large amounts to `1,23 tỷ` / `$489.0M`. Defaults to true. */
  compact?: boolean;
};

export function formatMoney(value: Money | null | undefined, options: FormatMoneyOptions = {}): string {
  if (!value) return "—";

  const { compact = true } = options;
  if (!compact) return formatExact(value);

  return value.currency === "VND" ? formatCompactVnd(value.amount) : formatCompactWestern(value);
}

function formatExact({ amount, currency }: Money) {
  const grouped = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(amount);
  // Vietnamese writes the dong sign after the amount and foreign signs before it.
  return currency === "VND" ? `${grouped} ₫` : `${CURRENCY_META[currency].symbol}${grouped}`;
}

/** VND reads naturally in Vietnamese scale words rather than Intl's `T`/`Tr` notation. */
function formatCompactVnd(amount: number) {
  if (amount >= 1_000_000_000_000) return `${formatDecimal(amount / 1_000_000_000_000)} nghìn tỷ ₫`;
  if (amount >= 1_000_000_000) return `${formatDecimal(amount / 1_000_000_000)} tỷ ₫`;
  if (amount >= 1_000_000) return `${formatDecimal(amount / 1_000_000)} triệu ₫`;
  return formatExact({ amount, currency: "VND" });
}

function formatCompactWestern(value: Money) {
  const { amount, currency } = value;
  if (amount < 1_000_000) return formatExact(value);

  const [scaled, suffix] = amount >= 1_000_000_000 ? [amount / 1_000_000_000, "B"] : [amount / 1_000_000, "M"];
  return `${CURRENCY_META[currency].symbol}${formatDecimal(scaled)}${suffix}`;
}

/** One decimal at most, so headline figures stay scannable across currencies. */
function formatDecimal(value: number) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(value);
}
