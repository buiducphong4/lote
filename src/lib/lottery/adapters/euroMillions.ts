import { getCached, TTL } from "../cache";
import { fetchWithTimeout } from "../fetcher";
import { getGame } from "../games";
import { normalizeEuroMillions } from "../normalize";
import type { HistoryQuery, HistoryResult, LotteryAdapter, LotteryDraw } from "../types";

const game = getGame("eu_euromillions");
const preferredUrl = "https://euromillions.api.pedromealha.dev/v1/draws";
const fallbackUrl = "https://euromillions.api.pedromealha.dev/draws";

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
        warnings.push("Không tải được EuroMillions ở thời điểm này.");
        return { data: null, warnings };
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
