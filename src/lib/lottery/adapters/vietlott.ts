import * as cheerio from "cheerio";
import { getCached, TTL } from "../cache";
import { fetchWithTimeout } from "../fetcher";
import { getGame } from "../games";
import { money, parseMoneyText } from "../money";
import { normalizeVietlottJsonl, toIsoDate, toVietlottDataFile } from "../normalize";
import type { HistoryQuery, HistoryResult, LotteryAdapter, LotteryDraw, LotteryGameId, PrizeTier } from "../types";

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
    minhNgocSelector: ".vkt-lotto"
  },
  vietlott_power_655: {
    slug: "655",
    technicalId: "power_655",
    mainCount: 6,
    minhNgocPath: "power",
    minhNgocSelector: ".vkt-power"
  },
  vietlott_mega_645: {
    slug: "645",
    technicalId: "power_645",
    mainCount: 6,
    minhNgocPath: "mega",
    minhNgocSelector: ".vkt-mega"
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
          // vietlott.vn only answers Vietnamese IPs, so a deployed server never gets through here.
        }

        try {
          return { data: await readMinhNgocLatest(gameId), warnings };
        } catch {
          // Keep the UI quiet and continue to the community history fallback.
        }

        try {
          const fallback = await readVietlottJsonl(gameId);
          const draw = fallback[0] ? await enrichVietlottDraw(gameId, fallback[0]) : null;

          // The community dataset carries only the numbers. Say so rather than leaving a bare
          // "Chưa công bố" that looks like a bug.
          if (draw && !draw.jackpot) {
            warnings.push(
              `${game.name}: chưa lấy được giá trị jackpot. vietlott.vn chặn truy cập từ ngoài Việt Nam và nguồn dự phòng cũng không trả về số tiền; bộ số và kỳ quay vẫn chính xác.`
            );
          }

          return { data: draw, warnings };
        } catch {
          warnings.push(`Không tải được kết quả ${game.name} ở thời điểm này.`);
          return { data: null, warnings };
        }
      });
    },
    async getHistory(query = {}) {
      return getCached(`history:${gameId}:${JSON.stringify(query)}`, TTL.history, async () => {
        const warnings = [
          "Lịch sử Vietlott lấy từ vietvudanh/vietlott-data, jackpot được bổ sung từ trang chi tiết Vietlott khi tải được."
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
  // vietlott.vn also puts the next draw's balls up blank before draw time, and `Number("")` is 0.
  const numbers = numberTexts.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
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
        prize: parseMoneyText(cells[3], "VND")
      };
    })
    .get()
    .filter(Boolean) as PrizeTier[];

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
    jackpot: parseMoneyText(jackpots[0], "VND") ?? parseMoneyText(headerJackpot, "VND") ?? jackpotFromPrizeTable(prizeTable),
    jackpot2: parseMoneyText(jackpots[1], "VND"),
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
  const liveUrl = `https://xosominhngoc.net.vn/${config[gameId].minhNgocPath}`;
  const live = await loadMinhNgoc(liveUrl);
  const latest = parseMinhNgocBlock(live, gameId, liveUrl);
  if (latest) return latest;

  /*
   * Minh Ngoc puts the upcoming draw on the front page hours before it happens, with the balls
   * rendered empty and the jackpot masked. Read as a result that becomes a card of six zeroes, so
   * when the headline block holds nothing yet, step back through the dated archive pages instead.
   */
  for (const url of minhNgocArchiveUrls(live).slice(0, 2)) {
    const page = await loadMinhNgoc(url);
    const archived = parseMinhNgocBlock(page, gameId, url);
    if (archived) return archived;
  }

  throw new Error("Minh Ngoc has no completed draw for this game.");
}

async function loadMinhNgoc(url: string) {
  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://xosominhngoc.net.vn/"
    }
  });

  return cheerio.load(await response.text());
}

/** The dated result pages linked from a game's page, newest first: "/kqxs-mega-645-ngay-06-11-2026". */
function minhNgocArchiveUrls($: cheerio.CheerioAPI) {
  const dateByHref = new Map<string, string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    const match = href.match(/^\/kqxs-[a-z0-9-]+-ngay-(\d{2})-(\d{2})-(\d{4})$/);
    if (match) dateByHref.set(href, `${match[3]}-${match[2]}-${match[1]}`);
  });

  return [...dateByHref.entries()]
    .sort((a, b) => b[1].localeCompare(a[1]))
    .map(([href]) => `https://xosominhngoc.net.vn${href}`);
}

/** Returns null when the block describes a draw that has not been held yet. */
function parseMinhNgocBlock($: cheerio.CheerioAPI, gameId: VietlottGameId, sourceUrl: string): LotteryDraw | null {
  const game = getGame(gameId);
  if (!game) throw new Error(`Unknown Vietlott game: ${gameId}`);

  const details = config[gameId];
  const root = $(details.minhNgocSelector).first();
  if (!root.length) return null;

  const drawNo = normalizeDrawNo(root.find(".vk-kyve, .kyve").first().text());
  // The heading reads "... ngay 06/11/2026, 18 gio" on both the live page and the dated ones.
  const dateMatch = root.find(".vk-ten").first().text().match(/(\d{2}\/\d{2}\/\d{4})/);
  const numbers = root
    .find(".vk-bong li")
    .map((_, element) => {
      const item = $(element);
      // The live page animates each ball and keeps its value in a `data` attribute; a dated page
      // simply prints it. Ahead of draw time both render the balls empty.
      const ball = item.find(".kq").first();
      return (ball.attr("data") ?? (ball.length ? ball.text() : item.text())).trim();
    })
    .get()
    .map((value) => Number(value))
    // `Number("")` is 0, which looks exactly like a drawn ball until you notice there are six of them.
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!drawNo || !dateMatch || numbers.length < details.mainCount) return null;

  const prizeTable = root
    .find("table.vk-giai tbody tr")
    .map((_, row) => {
      const cells = $(row).find("td");
      const tier = $(row).find("th").first().text().replace(/\s+/g, " ").trim();
      if (!tier || cells.length < 3) return null;

      const matchLabel = cells.eq(0).find("[aria-label]").first().attr("aria-label");
      const winnerCell = cells.eq(1);
      const prizeCell = cells.eq(2);

      return {
        tier,
        match: matchLabel?.replace(/\s+/g, " ").trim(),
        winners: parseVietnameseNumber(winnerCell.find("[data]").first().attr("data") ?? winnerCell.text()),
        prize: readMinhNgocPrize(prizeCell.find("[data]").first().attr("data"), prizeCell.text())
      };
    })
    .get()
    .filter(Boolean) as PrizeTier[];

  const mainNumbers = numbers.slice(0, details.mainCount);
  const extraNumbers = numbers.slice(details.mainCount);
  // Scope to the header panel: the prize table repeats the same `.jackpot` nodes.
  const jackpotNode = root.find(".vk-jp .jackpot").first();
  const jackpot2Node = root.find(".vk-jp .jackpot2").first();
  // Dated pages drop the animated nodes and print the amount in a plain <strong> instead.
  const plainAmounts = root.find(".vk-jp strong");
  const jackpot = readMinhNgocPrize(jackpotNode.attr("data"), jackpotNode.text() || plainAmounts.eq(0).text());
  const jackpot2 = readMinhNgocPrize(jackpot2Node.attr("data"), jackpot2Node.text() || plainAmounts.eq(1).text());

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

function jackpotFromPrizeTable(prizeTable: PrizeTier[]) {
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
  return money(Number(digits), "VND");
}
