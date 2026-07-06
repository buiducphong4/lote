import * as cheerio from "cheerio";
import { getCached, TTL } from "../cache";
import { fetchWithTimeout } from "../fetcher";
import { getGame } from "../games";
import { normalizeMegaMillions } from "../normalize";
import type { HistoryQuery, HistoryResult, LotteryAdapter, LotteryDraw } from "../types";

const gameMeta = getGame("us_mega_millions");
const baseUrl = "https://data.ny.gov/resource/5xaw-6ayf.json";
const texasCsvUrl =
  "https://www.texaslottery.com/export/sites/lottery/Games/Mega_Millions/Winning_Numbers/megamillions.csv";
const texasHtmlUrl = "https://www.texaslottery.com/export/sites/lottery/Games/Mega_Millions/Winning_Numbers/";

if (!gameMeta) throw new Error("Mega Millions game metadata missing.");
const game = gameMeta;

export const megaMillionsAdapter: LotteryAdapter = {
  gameId: "us_mega_millions",
  async getLatest() {
    return getCached("latest:us_mega_millions", TTL.latest, async () => {
      const { draws, warnings } = await loadMegaMillionsDraws("$limit=1&$order=draw_date%20DESC");
      return { data: draws[0] ?? null, warnings };
    });
  },
  async getHistory(query = {}) {
    return getCached(`history:us_mega_millions:${JSON.stringify(query)}`, TTL.history, async () => {
      const { draws, warnings } = await loadMegaMillionsDraws("$limit=50000&$order=draw_date%20DESC");
      return { data: paginate(filterDraws(draws, query), query), warnings };
    });
  }
};

async function loadMegaMillionsDraws(socrataQuery: string) {
  const warnings: string[] = [];

  try {
    const rows = await fetchMegaMillionsRows(socrataQuery);
    const draws = rows
      .map((row) => normalizeMegaMillions(row, game))
      .sort((a, b) => b.drawDate.localeCompare(a.drawDate));

    if (draws.length) return { draws, warnings };
  } catch {
    warnings.push("NY Open Data dang chan Mega Millions; dang dung nguon Texas Lottery.");
  }

  const texasDraws = await fetchTexasMegaMillions();
  if (!texasDraws.length) {
    warnings.push("Texas Lottery tam thoi khong tra du lieu Mega Millions; vui long thu lai sau.");
  }
  return { draws: texasDraws, warnings };
}

async function fetchMegaMillionsRows(query: string) {
  const response = await fetchWithTimeout(`${baseUrl}?${query}`, {
    headers: {
      Accept: "application/json",
      "X-App-Token": process.env.SOCRATA_APP_TOKEN ?? ""
    }
  });
  return (await response.json()) as unknown[];
}

async function fetchTexasMegaMillions() {
  return getCached("raw:mega-millions:texas", TTL.history, async () => {
    const csvDraws = await fetchTexasCsvMegaMillions().catch(() => [] as LotteryDraw[]);
    const htmlDraws = await fetchTexasHtmlMegaMillions().catch(() => [] as LotteryDraw[]);
    const htmlByDate = new Map(htmlDraws.map((draw) => [draw.drawDate, draw]));
    const merged = csvDraws.map((draw) => ({ ...draw, ...(htmlByDate.get(draw.drawDate) ?? {}) }));
    const csvDates = new Set(csvDraws.map((draw) => draw.drawDate));

    for (const draw of htmlDraws) {
      if (!csvDates.has(draw.drawDate)) merged.push(draw);
    }

    return merged.sort((a, b) => b.drawDate.localeCompare(a.drawDate));
  });
}

async function fetchTexasCsvMegaMillions() {
  const response = await fetchWithTimeout(texasCsvUrl, {
    headers: { Accept: "text/csv,*/*" }
  });
  const csv = await response.text();

  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseTexasCsvLine)
    .filter(Boolean) as LotteryDraw[];
}

async function fetchTexasHtmlMegaMillions() {
  const response = await fetchWithTimeout(texasHtmlUrl, {
    headers: { Accept: "text/html,*/*" }
  });
  const html = await response.text();
  const $ = cheerio.load(html);
  const draws: LotteryDraw[] = [];

  $("tr").each((_, row) => {
    const cells = $(row)
      .find("td")
      .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim())
      .get();

    if (cells.length < 5 || !/^\d{2}\/\d{2}\/\d{4}$/.test(cells[0])) return;

    const drawDate = toIsoFromUsDate(cells[0]);
    const mainNumbers = parseNumbers(cells[1]).sort((a, b) => a - b);
    const megaBall = Number(cells[2]);
    const multiplierText = cells[3];
    const jackpot = cells[4] || null;
    const winnersText = cells[5];

    if (mainNumbers.length !== 5 || !Number.isFinite(megaBall)) return;

    draws.push({
      id: `us_mega_millions-${drawDate}`,
      gameId: "us_mega_millions",
      region: "US",
      gameName: game.name,
      drawDate,
      mainNumbers,
      bonusNumbers: [megaBall],
      specialNumbers: multiplierText ? parseMultiplierRange(multiplierText) : undefined,
      jackpot,
      prizeTable: jackpot
        ? [
            {
              tier: "Jackpot",
              match: "5 so + Mega Ball",
              winners: winnersText.toLowerCase() === "roll" ? 0 : parseInteger(winnersText),
              prize: jackpot
            }
          ]
        : undefined,
      sourceName: "Texas Lottery",
      sourceUrl: texasHtmlUrl,
      updatedAt: new Date().toISOString()
    });
  });

  return draws;
}

function parseTexasCsvLine(line: string): LotteryDraw | null {
  const parts = line.split(",").map((part) => part.trim());
  if (parts.length < 11 || parts[0] !== "Mega Millions") return null;

  const month = Number(parts[1]);
  const day = Number(parts[2]);
  const year = Number(parts[3]);
  const mainNumbers = parts.slice(4, 9).map(Number).sort((a, b) => a - b);
  const megaBall = Number(parts[9]);
  const multiplier = Number(parts[10]);

  if (![month, day, year, megaBall, ...mainNumbers].every(Number.isFinite)) return null;

  const drawDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    id: `us_mega_millions-${drawDate}`,
    gameId: "us_mega_millions",
    region: "US",
    gameName: game.name,
    drawDate,
    mainNumbers,
    bonusNumbers: [megaBall],
    specialNumbers: Number.isFinite(multiplier) && multiplier > 0 ? [multiplier] : undefined,
    jackpot: null,
    sourceName: "Texas Lottery",
    sourceUrl: texasCsvUrl,
    updatedAt: new Date().toISOString()
  };
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

function toIsoFromUsDate(value: string) {
  const [month, day, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function parseNumbers(value: string) {
  return value
    .split(/[^\d]+/)
    .map(Number)
    .filter(Number.isFinite);
}

function parseInteger(value: string) {
  const parsed = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMultiplierRange(value: string) {
  const multipliers = value
    .split(/[^\d]+/)
    .map(Number)
    .filter((item) => Number.isFinite(item) && item > 0);
  return multipliers.length === 1 ? multipliers : undefined;
}
