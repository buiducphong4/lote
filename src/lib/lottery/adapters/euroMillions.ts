import { getCached, TTL } from "../cache";
import { fetchWithTimeout } from "../fetcher";
import { getGame } from "../games";
import { normalizeEuroMillions } from "../normalize";
import type { HistoryQuery, HistoryResult, LotteryAdapter, LotteryDraw } from "../types";

const game = getGame("eu_euromillions");
const preferredUrl = "https://euromillions.api.pedromealha.dev/v1/draws";
const fallbackUrl = "https://euromillions.api.pedromealha.dev/draws";
const lottolandUrl = "https://www.lottoland.com/api/drawings/euroMillions";

const EURO_MILLIONS_PRIZE_TIERS = [
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
  { rank: 12, main: 2, stars: 1 },
  { rank: 13, main: 2, stars: 0 }
];

if (!game) throw new Error("EuroMillions game metadata missing.");

export const euroMillionsAdapter: LotteryAdapter = {
  gameId: "eu_euromillions",
  async getLatest() {
    return getCached("latest:eu_euromillions", TTL.latest, async () => {
      const warnings: string[] = [];
      try {
        const rows = await fetchDraws();
        const draws = rows.map((row) => normalizeEuroMillions(row, game));
        return { data: draws.sort((a, b) => b.drawDate.localeCompare(a.drawDate))[0] ?? null, warnings };
      } catch {
        try {
          return { data: await fetchLottolandLatest(), warnings };
        } catch {
          return { data: null, warnings };
        }
      }
    });
  },
  async getHistory(query = {}) {
    return getCached(`history:eu_euromillions:${JSON.stringify(query)}`, TTL.history, async () => {
      const warnings: string[] = [];
      try {
        const { rows, failedYears } = await fetchHistoryRows(query);
        if (failedYears.length) {
          warnings.push(`EuroMillions bị giới hạn tạm thời ở năm ${failedYears.join(", ")}; đang hiển thị các năm tải được.`);
        }
        const draws = rows
          .map((row) => normalizeEuroMillions(row, game))
          .sort((a, b) => b.drawDate.localeCompare(a.drawDate));
        return { data: paginate(filterDraws(draws, query), query), warnings };
      } catch {
        warnings.push("Không tải được lịch sử EuroMillions ở thời điểm này.");
        return { data: paginate([], query), warnings };
      }
    });
  }
};

async function fetchHistoryRows(query: HistoryQuery) {
  try {
    return { rows: await fetchDraws(), failedYears: [] as number[] };
  } catch {
    const years = yearsForQuery(query);

    if (!years.length) {
      throw new Error("EuroMillions all-draw endpoint failed.");
    }

    const rows: unknown[] = [];
    const failedYears: number[] = [];

    for (const year of years) {
      try {
        rows.push(...(await fetchDraws(String(year))));
        await sleep(300);
      } catch {
        failedYears.push(year);
      }
    }

    return { rows, failedYears };
  }
}

function yearsForQuery(query: HistoryQuery) {
  if (!query.from && !query.to) return [];

  const currentYear = new Date().getFullYear();
  const fromYear = query.from ? Number(query.from.slice(0, 4)) : 2004;
  const toYear = query.to ? Number(query.to.slice(0, 4)) : currentYear;

  if (!Number.isFinite(fromYear) || !Number.isFinite(toYear)) return [];

  const start = Math.max(2004, Math.min(fromYear, toYear));
  const end = Math.min(currentYear, Math.max(fromYear, toYear));
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

async function fetchDraws(year?: string) {
  return getCached(`raw:euromillions:${year ?? "all"}`, TTL.history, async () => {
    const query = year ? `?year=${encodeURIComponent(year)}` : "";

    try {
      const response = await fetchWithTimeout(`${preferredUrl}${query}`);
      return normalizePayload(await response.json());
    } catch {
      const response = await fetchWithTimeout(`${fallbackUrl}${query}`);
      return normalizePayload(await response.json());
    }
  });
}

async function fetchLottolandLatest(): Promise<LotteryDraw> {
  const response = await fetchWithTimeout(lottolandUrl, {
    headers: {
      Referer: "https://www.lottoland.com/en/euromillions/results-winning-numbers"
    }
  });
  const payload = (await response.json()) as Record<string, unknown>;
  const row = getRecord(payload.last);
  const odds = getRecord(row.odds);
  const date = getRecord(row.date);
  const day = readNumber(date, "day");
  const month = readNumber(date, "month");
  const year = readNumber(date, "year");
  const numbers = readNumberArray(row.numbers);
  const stars = readNumberArray(row.stars);
  const drawNo = readString(row, "nr");

  if (!day || !month || !year || numbers.length < 5 || stars.length < 2) {
    throw new Error("Lottoland EuroMillions response missing required fields.");
  }

  const prizeTable = EURO_MILLIONS_PRIZE_TIERS.map((tier) => {
    const rank = getRecord(odds[`rank${tier.rank}`]);
    const prizeCents = readNumber(rank, "prize");
    return {
      tier: `${tier.main} so + ${tier.stars} sao`,
      winners: readNumber(rank, "winners"),
      prize: prizeCents && prizeCents > 0 ? formatEuro(prizeCents / 100) : null
    };
  });
  const jackpot = prizeTable[0]?.prize ?? formatEuroMillionsValue(readString(row, "marketingJackpot"));
  const drawDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    id: `eu_euromillions-${drawNo ?? drawDate}`,
    gameId: "eu_euromillions",
    region: "EU",
    gameName: game!.name,
    drawDate,
    drawNo: drawNo ?? undefined,
    mainNumbers: numbers.slice(0, 5).sort((a, b) => a - b),
    bonusNumbers: stars.slice(0, 2).sort((a, b) => a - b),
    jackpot,
    prizeTable,
    sourceName: "Lottoland EuroMillions draw API",
    sourceUrl: lottolandUrl,
    updatedAt: new Date().toISOString()
  };
}

function normalizePayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const object = payload as Record<string, unknown>;
    if (Array.isArray(object.draws)) return object.draws;
    if (Array.isArray(object.data)) return object.data;
  }
  return [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRecord(value: unknown) {
  if (Array.isArray(value)) return getRecord(value[0]);
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(row: Record<string, unknown>, key: string) {
  const value = row[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

function readNumber(row: Record<string, unknown>, key: string) {
  const value = readString(row, key);
  if (!value) return null;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function readNumberArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => Number(item)).filter(Number.isFinite);
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function formatEuroMillionsValue(value: string | null) {
  if (!value) return null;
  const amount = Number(value.replace(/[^\d.,-]/g, "").replace(",", "."));
  if (!Number.isFinite(amount)) return value;
  return `${formatEuro(amount)} Million`;
}

function filterDraws(draws: LotteryDraw[], query: HistoryQuery) {
  return draws.filter((draw) => {
    if (query.from && draw.drawDate < query.from) return false;
    if (query.to && draw.drawDate > query.to) return false;
    if (query.search && !draw.drawNo?.includes(query.search) && !draw.drawDate.includes(query.search)) return false;
    return true;
  });
}

function paginate(draws: LotteryDraw[], query: HistoryQuery): HistoryResult {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 30));
  const start = (page - 1) * pageSize;
  return { draws: draws.slice(start, start + pageSize), page, pageSize, total: draws.length };
}
