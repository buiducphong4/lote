import { z } from "zod";
import type { LotteryDraw, LotteryGame, LotteryGameId } from "./types";

const vietlottJsonlSchema = z.object({
  date: z.string(),
  id: z.string(),
  result: z.array(z.coerce.number()),
  process_time: z.string().optional()
});

const megaMillionsSchema = z.object({}).passthrough();
const euroMillionsSchema = z.object({}).passthrough();
const euroJackpotSchema = z.object({}).passthrough();

const EURO_JACKPOT_PRIZE_TIERS = [
  { rank: 1, main: 5, stars: 2 },
  { rank: 2, main: 5, stars: 1 },
  { rank: 3, main: 5, stars: 0 },
  { rank: 4, main: 4, stars: 2 },
  { rank: 5, main: 4, stars: 1 },
  { rank: 6, main: 3, stars: 2 },
  { rank: 7, main: 4, stars: 0 },
  { rank: 8, main: 2, stars: 2 },
  { rank: 9, main: 3, stars: 1 },
  { rank: 10, main: 3, stars: 0 },
  { rank: 11, main: 1, stars: 2 },
  { rank: 12, main: 2, stars: 1 }
];

export function toIsoDate(value: string) {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date.toISOString().slice(0, 10);
}

export function normalizeVietlottJsonl(raw: unknown, game: LotteryGame): LotteryDraw {
  const row = vietlottJsonlSchema.parse(raw);
  const numbers = row.result;
  const isPower655 = game.id === "vietlott_power_655";
  const isLotto535 = game.id === "vietlott_lotto_535";
  const mainCount = isPower655 || game.id === "vietlott_mega_645" ? 6 : 5;
  const mainNumbers = numbers.slice(0, mainCount);
  const tail = numbers.slice(mainCount);

  return {
    id: `${game.id}-${row.id}`,
    gameId: game.id,
    region: game.region,
    gameName: game.name,
    drawDate: toIsoDate(row.date),
    drawNo: row.id,
    mainNumbers,
    bonusNumbers: isLotto535 && tail.length ? tail : undefined,
    specialNumbers: isPower655 && tail.length ? tail : undefined,
    jackpot: null,
    sourceName: "vietvudanh/vietlott-data",
    sourceUrl: `https://github.com/vietvudanh/vietlott-data/blob/main/data/${toVietlottDataFile(game.id)}`,
    updatedAt: row.process_time ? new Date(row.process_time.replace(" ", "T")).toISOString() : new Date().toISOString()
  };
}

export function normalizeMegaMillions(raw: unknown, game: LotteryGame): LotteryDraw {
  const row = megaMillionsSchema.parse(raw) as Record<string, unknown>;
  const drawDate = readString(row, ["draw_date", "draw date", "date"]);
  const numbersText = readString(row, [
    "winning_numbers",
    "winning numbers",
    "winning_number",
    "winning number"
  ]);
  const megaBall = readNumber(row, ["mega_ball", "mega ball", "bonus_number", "bonus number"]);
  const multiplier = readNumber(row, ["multiplier", "megaplier", "mega_plier"]);
  const jackpot = readString(row, ["jackpot", "jackpot_amount", "jackpot amount"]);
  const numbers = parseNumbers(numbersText);

  if (!drawDate || numbers.length < 5) {
    throw new Error("Mega Millions response missing draw date or winning numbers.");
  }

  return {
    id: `${game.id}-${toIsoDate(drawDate)}`,
    gameId: game.id,
    region: game.region,
    gameName: game.name,
    drawDate: toIsoDate(drawDate),
    mainNumbers: numbers.slice(0, 5).sort((a, b) => a - b),
    bonusNumbers: megaBall ? [megaBall] : numbers[5] ? [numbers[5]] : undefined,
    specialNumbers: multiplier ? [multiplier] : undefined,
    jackpot: jackpot ?? null,
    sourceName: "NY Open Data",
    sourceUrl: game.sourceUrl,
    updatedAt: new Date().toISOString()
  };
}

export function normalizeEuroMillions(raw: unknown, game: LotteryGame): LotteryDraw {
  const row = euroMillionsSchema.parse(raw) as Record<string, unknown>;
  const numbers = readArrayNumbers(row, ["numbers", "main_numbers", "mainNumbers"]);
  const stars = readArrayNumbers(row, ["stars", "lucky_stars", "star_numbers", "starNumbers"]);
  const drawDate = readString(row, ["date", "draw_date", "drawDate"]);
  const drawId = readString(row, ["draw_id", "drawId", "id"]);
  const prizes = Array.isArray(row.prizes) ? row.prizes : [];

  if (!drawDate || numbers.length < 5 || stars.length < 2) {
    throw new Error("EuroMillions response missing date, numbers, or stars.");
  }

  const prizeRows = prizes.map((prize) => {
    const item = prize as Record<string, unknown>;
    const matchedNumbers = readNumber(item, ["matched_numbers", "matchedNumbers"]);
    const matchedStars = readNumber(item, ["matched_stars", "matchedStars"]);
    const prizeAmount = readNumber(item, ["prize"]);
    return {
      tier: `${matchedNumbers ?? "?"} so + ${matchedStars ?? "?"} sao`,
      winners: readNumber(item, ["winners"]),
      prize: prizeAmount === null ? readString(item, ["prize"]) : formatEuro(prizeAmount),
      matchedNumbers,
      matchedStars
    };
  });
  const jackpot =
    readString(row, ["jackpot", "top_prize"]) ??
    prizeRows.find((prize) => prize.matchedNumbers === 5 && prize.matchedStars === 2)?.prize ??
    null;

  return {
    id: `${game.id}-${drawId ?? toIsoDate(drawDate)}`,
    gameId: game.id,
    region: game.region,
    gameName: game.name,
    drawDate: toIsoDate(drawDate),
    drawNo: drawId ?? undefined,
    mainNumbers: numbers.slice(0, 5).sort((a, b) => a - b),
    bonusNumbers: stars.slice(0, 2).sort((a, b) => a - b),
    jackpot,
    prizeTable: prizeRows.map(({ matchedNumbers, matchedStars, ...prize }) => prize),
    sourceName: "EuroMillions community API",
    sourceUrl: "https://euromillions.api.pedromealha.dev/v1/draws",
    updatedAt: new Date().toISOString()
  };
}

export function normalizeEuroJackpot(raw: unknown, game: LotteryGame): LotteryDraw {
  const payload = euroJackpotSchema.parse(raw) as Record<string, unknown>;
  const row = Array.isArray(payload.last) ? payload.last[0] : isRecord(payload.last) ? payload.last : payload;
  const numbers = readArrayNumbers(row, ["numbers", "main_numbers", "mainNumbers"]);
  const euroNumbers = readArrayNumbers(row, ["euroNumbers", "euro_numbers", "bonusNumbers", "stars"]);
  const drawDate = readEuroJackpotDate(row);
  const drawNo = readString(row, ["nr", "draw_id", "drawId", "id"]);
  const odds = isRecord(row.odds) ? row.odds : {};
  const rank1 = isRecord(odds.rank1) ? odds.rank1 : null;
  const rank1Prize = rank1 ? readNumber(rank1, ["prize"]) : null;

  if (!drawDate || numbers.length < 5 || euroNumbers.length < 2) {
    throw new Error("EuroJackpot response missing date, numbers, or euro numbers.");
  }

  const prizeRows = EURO_JACKPOT_PRIZE_TIERS.map((tier) => {
    const rank = isRecord(odds[`rank${tier.rank}`]) ? odds[`rank${tier.rank}`] : {};
    const prizeCents = isRecord(rank) ? readNumber(rank, ["prize"]) : null;
    return {
      tier: `${tier.main} so + ${tier.stars} euro`,
      winners: isRecord(rank) ? readNumber(rank, ["winners"]) : null,
      prize: prizeCents && prizeCents > 0 ? formatEuroCents(prizeCents) : null
    };
  });

  return {
    id: `${game.id}-${drawNo ?? drawDate}`,
    gameId: game.id,
    region: game.region,
    gameName: game.name,
    drawDate,
    drawNo: drawNo ?? undefined,
    mainNumbers: numbers.slice(0, 5).sort((a, b) => a - b),
    bonusNumbers: euroNumbers.slice(0, 2).sort((a, b) => a - b),
    jackpot: rank1Prize && rank1Prize > 0 ? formatEuroCents(rank1Prize) : formatEuroMillionsValue(readString(row, ["jackpot", "marketingJackpot"])),
    prizeTable: prizeRows,
    sourceName: "Lottoland EuroJackpot draw API",
    sourceUrl: `https://www.lottoland.com/api/drawings/euroJackpot/${drawDate.replaceAll("-", "")}`,
    updatedAt: new Date().toISOString()
  };
}

export function computeNumberStats(draws: LotteryDraw[]) {
  const stats = new Map<number, { number: number; count: number; lastAppeared: string | null }>();
  const sorted = [...draws].sort((a, b) => b.drawDate.localeCompare(a.drawDate));

  for (const draw of sorted) {
    for (const number of draw.mainNumbers) {
      const entry = stats.get(number) ?? { number, count: 0, lastAppeared: null };
      entry.count += 1;
      entry.lastAppeared ??= draw.drawDate;
      stats.set(number, entry);
    }
  }

  return [...stats.values()].sort((a, b) => b.count - a.count || a.number - b.number);
}

export function toVietlottDataFile(gameId: LotteryGameId) {
  const map: Record<Extract<LotteryGameId, "vietlott_lotto_535" | "vietlott_power_655" | "vietlott_mega_645">, string> = {
    vietlott_lotto_535: "power535.jsonl",
    vietlott_power_655: "power655.jsonl",
    vietlott_mega_645: "power645.jsonl"
  };

  return map[gameId as keyof typeof map];
}

function readString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
}

function readNumber(row: Record<string, unknown>, keys: string[]) {
  const value = readString(row, keys);
  if (!value) return null;
  const numeric = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function readArrayNumbers(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (Array.isArray(value)) {
      return value.map((item) => Number(item)).filter(Number.isFinite);
    }
    if (typeof value === "string") {
      const parsed = parseNumbers(value);
      if (parsed.length) return parsed;
    }
  }

  return [];
}

function readEuroJackpotDate(row: Record<string, unknown>) {
  const date = row.date;

  if (isRecord(date)) {
    const day = readNumber(date, ["day"]);
    const month = readNumber(date, ["month"]);
    const year = readNumber(date, ["year"]);
    if (day && month && year) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const value = readString(row, ["drawingDate", "draw_date", "drawDate", "date"]);
  if (!value) return null;

  const euroDate = value.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (euroDate) {
    return `${euroDate[3]}-${euroDate[2]}-${euroDate[1]}`;
  }

  return toIsoDate(value);
}

function parseNumbers(value: string | null) {
  if (!value) return [];
  return value
    .split(/[,\s-]+/)
    .map((part) => Number(part))
    .filter(Number.isFinite);
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function formatEuroCents(value: number) {
  return formatEuro(value / 100);
}

function formatEuroMillionsValue(value: string | null) {
  if (!value) return null;
  const amount = Number(value.replace(/[^\d.,-]/g, "").replace(",", "."));
  if (!Number.isFinite(amount)) return value;
  return `${new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  }).format(amount)} Million`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
