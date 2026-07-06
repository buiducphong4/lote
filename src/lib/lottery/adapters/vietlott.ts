import * as cheerio from "cheerio";
import { getCached, TTL } from "../cache";
import { fetchWithTimeout } from "../fetcher";
import { getGame } from "../games";
import { normalizeVietlottJsonl, toIsoDate, toVietlottDataFile } from "../normalize";
import type { HistoryQuery, HistoryResult, LotteryAdapter, LotteryDraw, LotteryGameId } from "../types";

type VietlottGameId = Extract<LotteryGameId, "vietlott_lotto_535" | "vietlott_power_655" | "vietlott_mega_645">;

const config: Record<
  VietlottGameId,
  { slug: string; technicalId: string; mainCount: number; minhNgocPath: string; minhNgocSelector: string }
> = {
  vietlott_lotto_535: {
    slug: "535",
    technicalId: "power_535",
    mainCount: 5,
    minhNgocPath: "lotto535",
    minhNgocSelector: ".xslotto535"
  },
  vietlott_power_655: {
    slug: "655",
    technicalId: "power_655",
    mainCount: 6,
    minhNgocPath: "power",
    minhNgocSelector: ".xspower"
  },
  vietlott_mega_645: {
    slug: "645",
    technicalId: "power_645",
    mainCount: 6,
    minhNgocPath: "mega",
    minhNgocSelector: ".xsmega"
  }
};

const vietlottHtmlHeaders = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: "https://vietlott.vn/",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
};

export function createVietlottAdapter(gameId: VietlottGameId): LotteryAdapter {
  const game = getGame(gameId);
  if (!game) throw new Error(`Unknown Vietlott game: ${gameId}`);

  const sourceUrl = `https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/${config[gameId].slug}`;

  return {
    gameId,
    async getLatest() {
      return getCached(`latest:${gameId}`, TTL.latest, async () => {
        const warnings: string[] = [];

        try {
          const response = await fetchWithTimeout(`${sourceUrl}?nocatche=${Date.now()}`, {
            headers: vietlottHtmlHeaders
          });
          const html = await response.text();
          return { data: parseOfficialVietlott(html, gameId, sourceUrl), warnings };
        } catch {
          // Vercel can be blocked by Vietlott, so keep a second live source before falling back to JSONL.
        }

        try {
          return { data: await readMinhNgocLatest(gameId), warnings };
        } catch {
          // Keep the UI quiet and continue to the community history fallback.
        }

        try {
          const fallback = await readVietlottJsonl(gameId);
          return { data: fallback[0] ? await enrichVietlottDraw(gameId, fallback[0]) : null, warnings };
        } catch {
          return { data: null, warnings };
        }
      });
    },
    async getHistory(query = {}) {
      return getCached(`history:${gameId}:${JSON.stringify(query)}`, TTL.history, async () => {
        const warnings = [
          "Du lieu lich su Vietlott lay tu vietvudanh/vietlott-data; jackpot duoc bo sung tu trang chi tiet Vietlott neu tai duoc."
        ];
        const allDraws = await readVietlottJsonl(gameId);
        const paginated = paginate(filterDraws(allDraws, query), query);
        const enrichedDraws = await enrichVietlottHistoryPage(gameId, paginated.draws);
        return { data: { ...paginated, draws: enrichedDraws }, warnings };
      });
    }
  };
}

function parseOfficialVietlott(html: string, gameId: VietlottGameId, sourceUrl?: string): LotteryDraw {
  const game = getGame(gameId);
  if (!game) throw new Error(`Unknown Vietlott game: ${gameId}`);

  const $ = cheerio.load(html);
  const fullText = $("body").text().replace(/\s+/g, " ");
  const titleText = $(".chitietketqua_title").text().replace(/\s+/g, " ");
  const drawMatch =
    titleText.match(/#\s*(\d+).*?(\d{2}\/\d{2}\/\d{4})/i) ??
    fullText.match(/#\s*(\d+).*?(\d{2}\/\d{2}\/\d{4})/i);
  const numberTexts = $(".day_so_ket_qua_v2 span.bong_tron")
    .map((_, element) => $(element).text().trim())
    .get();
  const numbers = numberTexts.map((value) => Number(value)).filter(Number.isFinite);
  const mainCount = config[gameId].mainCount;

  if (!drawMatch || numbers.length < mainCount) {
    throw new Error("Vietlott official parser did not find required fields.");
  }

  const prizeTable = $(".chitietketqua_table table tbody tr")
    .map((_, row) => {
      const cells = $(row)
        .find("td")
        .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim())
        .get();
      if (cells.length < 4) return null;
      return {
        tier: cells[0],
        match: cells[1],
        winners: parseVietnameseNumber(cells[2]),
        prize: `${cells[3]} VND`
      };
    })
    .get()
    .filter(Boolean);

  const jackpots = $(".gt_jackpot .so_tien h3")
    .map((_, element) => $(element).text().trim())
    .get();
  const headerJackpot = $(".chitietketqua_table table thead tr")
    .first()
    .find("th")
    .last()
    .text()
    .replace(/\s+/g, " ")
    .trim();
  const mainNumbers = numbers.slice(0, mainCount);
  const extraNumbers = numbers.slice(mainCount);

  return {
    id: `${gameId}-${drawMatch[1]}`,
    gameId,
    region: "VN",
    gameName: game.name,
    drawDate: toIsoDate(drawMatch[2]),
    drawNo: drawMatch[1],
    mainNumbers,
    bonusNumbers: gameId === "vietlott_lotto_535" ? extraNumbers : undefined,
    specialNumbers: gameId === "vietlott_power_655" ? extraNumbers : undefined,
    jackpot: jackpots[0] ? `${jackpots[0]} VND` : normalizeVndPrize(headerJackpot) ?? jackpotFromPrizeTable(prizeTable),
    jackpot2: jackpots[1] ? `${jackpots[1]} VND` : null,
    prizeTable: prizeTable.length ? prizeTable : undefined,
    sourceName: "Vietlott",
    sourceUrl: sourceUrl ?? game.sourceUrl,
    updatedAt: new Date().toISOString()
  };
}

async function readVietlottJsonl(gameId: VietlottGameId) {
  const game = getGame(gameId);
  if (!game) return [];

  const file = toVietlottDataFile(gameId);
  const url = `https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/${file}`;
  const response = await fetchWithTimeout(url);
  const text = await response.text();

  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => normalizeVietlottJsonl(JSON.parse(line), game))
    .sort((a, b) => b.drawDate.localeCompare(a.drawDate) || (b.drawNo ?? "").localeCompare(a.drawNo ?? ""));
}

async function readMinhNgocLatest(gameId: VietlottGameId) {
  const game = getGame(gameId);
  if (!game) throw new Error(`Unknown Vietlott game: ${gameId}`);

  const details = config[gameId];
  const sourceUrl = `https://xosominhngoc.net.vn/${details.minhNgocPath}`;
  const response = await fetchWithTimeout(sourceUrl, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://xosominhngoc.net.vn/"
    }
  });
  const $ = cheerio.load(await response.text());
  const root = $(details.minhNgocSelector).first();

  if (!root.length) {
    throw new Error("Minh Ngoc fallback missing result container.");
  }

  const drawNo = normalizeDrawNo(root.find(".kyve").first().text());
  const dateText = root.find(".ngay").first().text();
  const dateMatch = dateText.match(/(\d{2}\/\d{2}\/\d{4})/);
  const numberTexts = root
    .find(".result .kq")
    .map((_, element) => $(element).attr("data") ?? $(element).text())
    .get();
  const numbers = numberTexts.map((value) => Number(String(value).trim())).filter(Number.isFinite);
  const mainCount = details.mainCount;

  if (!drawNo || !dateMatch || numbers.length < mainCount) {
    throw new Error("Minh Ngoc fallback missing draw number, date, or numbers.");
  }

  const prizeTable = root
    .find("table tbody tr")
    .map((_, row) => {
      const cells = $(row)
        .find("td")
        .map((__, cell) => $(cell).text().replace(/\s+/g, " ").trim())
        .get();
      if (cells.length < 4) return null;
      return {
        tier: cells[0],
        match: cells[1],
        winners: parseVietnameseNumber(cells[2]),
        prize: normalizeVndPrize(cells[3])
      };
    })
    .get()
    .filter(Boolean);
  const mainNumbers = numbers.slice(0, mainCount);
  const extraNumbers = numbers.slice(mainCount);
  const jackpot = readMinhNgocPrize(root.find(".jackpot").first().attr("data"), root.find(".jackpot").first().text());
  const jackpot2 = readMinhNgocPrize(root.find(".jackpot2").first().attr("data"), root.find(".jackpot2").first().text());

  return {
    id: `${gameId}-${drawNo}`,
    gameId,
    region: "VN" as const,
    gameName: game.name,
    drawDate: toIsoDate(dateMatch[1]),
    drawNo,
    mainNumbers,
    bonusNumbers: gameId === "vietlott_lotto_535" ? extraNumbers : undefined,
    specialNumbers: gameId === "vietlott_power_655" ? extraNumbers : undefined,
    jackpot: jackpot ?? jackpotFromPrizeTable(prizeTable),
    jackpot2,
    prizeTable: prizeTable.length ? prizeTable : undefined,
    sourceName: "Xo So Minh Ngoc",
    sourceUrl,
    updatedAt: new Date().toISOString()
  } satisfies LotteryDraw;
}

async function enrichVietlottHistoryPage(gameId: VietlottGameId, draws: LotteryDraw[]) {
  const enriched: LotteryDraw[] = [];
  const batchSize = 5;

  for (let index = 0; index < draws.length; index += batchSize) {
    const batch = draws.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map((draw) => enrichVietlottDraw(gameId, draw)));
    enriched.push(...batchResults);
  }

  return enriched;
}

async function enrichVietlottDraw(gameId: VietlottGameId, draw: LotteryDraw) {
  if (!draw.drawNo) return draw;

  return getCached(`vietlott-detail:${gameId}:${draw.drawNo}`, TTL.history, async () => {
    try {
      const game = getGame(gameId);
      if (!game) return draw;

      const detailUrl = `${game.sourceUrl}?id=${encodeURIComponent(draw.drawNo ?? "")}&nocatche=1`;
      const response = await fetchWithTimeout(detailUrl, {
        headers: vietlottHtmlHeaders
      });
      const html = await response.text();
      const official = parseOfficialVietlott(html, gameId, detailUrl);

      return {
        ...draw,
        jackpot: official.jackpot ?? draw.jackpot,
        jackpot2: official.jackpot2 ?? draw.jackpot2,
        prizeTable: official.prizeTable ?? draw.prizeTable,
        sourceName: official.sourceName,
        sourceUrl: detailUrl,
        updatedAt: official.updatedAt
      };
    } catch {
      return draw;
    }
  });
}

function filterDraws(draws: LotteryDraw[], query: HistoryQuery) {
  return draws.filter((draw) => {
    if (query.from && draw.drawDate < query.from) return false;
    if (query.to && draw.drawDate > query.to) return false;
    if (query.search && !draw.drawNo?.includes(query.search)) return false;
    return true;
  });
}

function paginate(draws: LotteryDraw[], query: HistoryQuery): HistoryResult {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 30));
  const start = (page - 1) * pageSize;
  return {
    draws: draws.slice(start, start + pageSize),
    page,
    pageSize,
    total: draws.length
  };
}

function jackpotFromPrizeTable(
  prizeTable: NonNullable<LotteryDraw["prizeTable"]>
): string | number | null {
  const jackpotRow = prizeTable.find((row) => /jackpot|doc dac|dac biet/i.test(removeVietnameseMarks(row.tier)));
  return jackpotRow?.prize ?? prizeTable[0]?.prize ?? null;
}

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D")
    .toLowerCase();
}

function normalizeVndPrize(value: string) {
  if (!value || !/\d/.test(value)) return null;
  return value.toUpperCase().includes("VND") ? value : `${value} VND`;
}

function parseVietnameseNumber(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDrawNo(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? digits.slice(-5).padStart(5, "0") : null;
}

function readMinhNgocPrize(rawData: string | undefined, rawText: string) {
  const digits = rawData?.replace(/\D/g, "") || rawText.replace(/\D/g, "");
  if (!digits) return null;
  return `${new Intl.NumberFormat("vi-VN").format(Number(digits))} VND`;
}
