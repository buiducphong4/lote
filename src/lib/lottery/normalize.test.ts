import { describe, expect, it } from "vitest";
import {
  computeNumberStats,
  normalizeEuroJackpot,
  normalizeEuroMillions,
  normalizeMegaMillions,
  normalizeVietlottJsonl,
  toIsoDate
} from "./normalize";
import type { LotteryGame } from "./types";

const vietlottGame: LotteryGame = {
  id: "vietlott_power_655",
  name: "Power 6/55",
  shortName: "Power 6/55",
  region: "VN",
  iconHint: "655",
  drawSchedule: "test",
  numberFormat: "test",
  sourceUrl: "https://example.com",
  accent: "from-teal-500 to-blue-500"
};

const megaGame: LotteryGame = {
  id: "us_mega_millions",
  name: "Mega Millions",
  shortName: "Mega Millions",
  region: "US",
  iconHint: "MM",
  drawSchedule: "test",
  numberFormat: "test",
  sourceUrl: "https://example.com",
  accent: "from-rose-500 to-amber-500"
};

const euroGame: LotteryGame = {
  id: "eu_euromillions",
  name: "EuroMillions",
  shortName: "EuroMillions",
  region: "EU",
  iconHint: "EU",
  drawSchedule: "test",
  numberFormat: "test",
  sourceUrl: "https://example.com",
  accent: "from-indigo-500 to-teal-500"
};

const euroJackpotGame: LotteryGame = {
  id: "eu_eurojackpot",
  name: "EuroJackpot",
  shortName: "EuroJackpot",
  region: "EU",
  iconHint: "EJ",
  drawSchedule: "test",
  numberFormat: "test",
  sourceUrl: "https://example.com",
  accent: "from-amber-500 to-emerald-500"
};

describe("normalize lottery data", () => {
  it("converts Vietnamese date strings to ISO dates", () => {
    expect(toIsoDate("27/06/2026")).toBe("2026-06-27");
  });

  it("normalizes Vietlott JSONL rows", () => {
    const draw = normalizeVietlottJsonl(
      { date: "2026-06-27", id: "01364", result: [7, 16, 21, 23, 28, 52, 54] },
      vietlottGame
    );

    expect(draw.mainNumbers).toEqual([7, 16, 21, 23, 28, 52]);
    expect(draw.specialNumbers).toEqual([54]);
    expect(draw.drawNo).toBe("01364");
  });

  it("normalizes and sorts flexible Mega Millions fields", () => {
    const draw = normalizeMegaMillions(
      {
        draw_date: "2026-06-26T00:00:00.000",
        winning_numbers: "5 13 52 33 30",
        mega_ball: "6",
        multiplier: "3"
      },
      megaGame
    );

    expect(draw.drawDate).toBe("2026-06-26");
    expect(draw.mainNumbers).toEqual([5, 13, 30, 33, 52]);
    expect(draw.bonusNumbers).toEqual([6]);
    expect(draw.specialNumbers).toEqual([3]);
  });

  it("normalizes EuroMillions numbers, stars, jackpot, and prize table", () => {
    const draw = normalizeEuroMillions(
      {
        date: "2026-01-13",
        draw_id: 42026,
        numbers: ["47", "6", "18", "44", "10"],
        stars: ["10", "2"],
        prizes: [{ matched_numbers: 5, matched_stars: 2, prize: 100, winners: 0 }]
      },
      euroGame
    );

    expect(draw.mainNumbers).toEqual([6, 10, 18, 44, 47]);
    expect(draw.bonusNumbers).toEqual([2, 10]);
    expect(draw.jackpot).toBe("€100.00");
    expect(draw.prizeTable?.[0].tier).toBe("5 so + 2 sao");
  });

  it("normalizes EuroJackpot numbers, euro numbers, jackpot, and prize table", () => {
    const draw = normalizeEuroJackpot(
      {
        nr: 969,
        currency: "EUR",
        date: { day: 3, month: 7, year: 2026 },
        numbers: [4, 9, 20, 25, 28],
        euroNumbers: [1, 3],
        odds: {
          rank1: { winners: 0, prize: 1726741252 },
          rank2: { winners: 2, prize: 86805200 }
        }
      },
      euroJackpotGame
    );

    expect(draw.drawDate).toBe("2026-07-03");
    expect(draw.mainNumbers).toEqual([4, 9, 20, 25, 28]);
    expect(draw.bonusNumbers).toEqual([1, 3]);
    expect(draw.jackpot).toBe("\u20ac17,267,413");
    expect(draw.prizeTable?.[0]).toMatchObject({ tier: "5 so + 2 euro", winners: 0, prize: "\u20ac17,267,413" });
  });

  it("computes descriptive number stats", () => {
    const stats = computeNumberStats([
      {
        id: "1",
        gameId: "vietlott_mega_645",
        region: "VN",
        gameName: "Mega",
        drawDate: "2026-06-01",
        mainNumbers: [1, 2],
        sourceName: "x",
        sourceUrl: "x",
        updatedAt: "x"
      },
      {
        id: "2",
        gameId: "vietlott_mega_645",
        region: "VN",
        gameName: "Mega",
        drawDate: "2026-06-02",
        mainNumbers: [2, 3],
        sourceName: "x",
        sourceUrl: "x",
        updatedAt: "x"
      }
    ]);

    expect(stats[0]).toMatchObject({ number: 2, count: 2, lastAppeared: "2026-06-02" });
  });
});
