import { getCached, TTL } from "../cache";
import { fetchWithTimeout } from "../fetcher";
import { getGame } from "../games";
import { normalizeEuroJackpot } from "../normalize";
import type { HistoryQuery, HistoryResult, LotteryAdapter, LotteryDraw } from "../types";

const game = getGame("eu_eurojackpot");
const baseUrl = "https://www.lottoland.com/api/drawings/euroJackpot";
const historyCap = 260;
const minHistoryRows = 30;

if (!game) throw new Error("EuroJackpot game metadata missing.");

export const euroJackpotAdapter: LotteryAdapter = {
  gameId: "eu_eurojackpot",
  async getLatest() {
    return getCached("latest:eu_eurojackpot", TTL.latest, async () => {
      const warnings: string[] = [];
      try {
        const latestDate = latestEuroJackpotDrawDate();
        const row = await fetchDraw(latestDate);
        return { data: normalizeEuroJackpot(row, game), warnings };
      } catch {
        warnings.push("Khong tai duoc EuroJackpot o thoi diem nay.");
        return { data: null, warnings };
      }
    });
  },
  async getHistory(query = {}) {
    return getCached(`history:eu_eurojackpot:${JSON.stringify(query)}`, TTL.history, async () => {
      const warnings: string[] = [];
      try {
        const dates = datesForQuery(query);
        if (dates.capped) {
          warnings.push(`EuroJackpot chi tai toi da ${historyCap} ky moi nhat trong khoang da chon.`);
        }

        const { rows, failedDates } = await fetchDraws(dates.values);
        if (failedDates.length) {
          warnings.push(`EuroJackpot bi gioi han tam thoi o ${failedDates.length} ky; dang hien thi cac ky tai duoc.`);
        }

        const draws = rows
          .map((row) => normalizeEuroJackpot(row, game))
          .sort((a, b) => b.drawDate.localeCompare(a.drawDate));

        return { data: paginate(filterDraws(draws, query), query), warnings };
      } catch {
        warnings.push("Khong tai duoc lich su EuroJackpot o thoi diem nay.");
        return { data: paginate([], query), warnings };
      }
    });
  }
};

async function fetchDraw(date: string) {
  return getCached(`raw:eurojackpot:${date}`, TTL.history, async () => {
    const response = await fetchWithTimeout(`${baseUrl}/${date}`, {
      headers: {
        Referer: "https://www.eurojackpot.org/en/"
      }
    });
    return normalizePayload(await response.json());
  });
}

async function fetchDraws(dates: string[]) {
  const rows: unknown[] = [];
  const failedDates: string[] = [];

  for (let index = 0; index < dates.length; index += 8) {
    const batch = dates.slice(index, index + 8);
    const results = await Promise.allSettled(batch.map((date) => fetchDraw(date)));

    results.forEach((result, resultIndex) => {
      if (result.status === "fulfilled") {
        rows.push(result.value);
      } else {
        failedDates.push(batch[resultIndex]);
      }
    });
  }

  return { rows, failedDates };
}

function normalizePayload(payload: unknown) {
  if (payload && typeof payload === "object") {
    const object = payload as Record<string, unknown>;
    const last = object.last;
    if (Array.isArray(last) && last[0]) return last[0];
    if (last && typeof last === "object") return last;
  }
  return payload;
}

function datesForQuery(query: HistoryQuery) {
  if (query.from || query.to) {
    return drawDatesInRange(query.from, query.to);
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? minHistoryRows));
  const needed = Math.min(historyCap, Math.max(minHistoryRows, page * pageSize));
  return { values: recentDrawDates(needed), capped: false };
}

function drawDatesInRange(from?: string, to?: string) {
  const latest = parseDate(latestEuroJackpotDrawDate());
  const lower = from ? parseDate(from.replaceAll("-", "")) : addDays(latest, -historyCap * 4);
  const rawUpper = to ? parseDate(to.replaceAll("-", "")) : latest;
  const upper = rawUpper > latest ? latest : rawUpper;
  if (lower > latest) {
    return { values: [], capped: false };
  }
  const start = lower < upper ? lower : upper;
  const end = lower < upper ? upper : lower;
  const values: string[] = [];

  for (let cursor = new Date(end); cursor >= start; cursor = addDays(cursor, -1)) {
    if (isDrawDay(cursor)) values.push(toApiDate(cursor));
    if (values.length >= historyCap) {
      return { values, capped: true };
    }
  }

  return { values, capped: false };
}

function recentDrawDates(count: number) {
  const dates: string[] = [];
  for (let cursor = parseDate(latestEuroJackpotDrawDate()); dates.length < count; cursor = addDays(cursor, -1)) {
    if (isDrawDay(cursor)) dates.push(toApiDate(cursor));
  }
  return dates;
}

function latestEuroJackpotDrawDate() {
  const now = getCentralEuropeNow();
  const minutes = now.getHours() * 60 + now.getMinutes();
  let cursor = new Date(now);

  if (!(isDrawDay(cursor) && minutes >= 1215)) {
    cursor = addDays(cursor, -1);
  }

  while (!isDrawDay(cursor)) {
    cursor = addDays(cursor, -1);
  }

  return toApiDate(cursor);
}

function getCentralEuropeNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" }));
}

function isDrawDay(date: Date) {
  return date.getDay() === 2 || date.getDay() === 5;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDate(value: string) {
  const compact = value.replaceAll("-", "");
  const year = Number(compact.slice(0, 4));
  const month = Number(compact.slice(4, 6));
  const day = Number(compact.slice(6, 8));
  return new Date(year, month - 1, day);
}

function toApiDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
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
