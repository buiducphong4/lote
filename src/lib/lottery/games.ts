import type { LotteryGame, LotteryGameId } from "./types";

export const games: LotteryGame[] = [
  {
    id: "vietlott_power_655",
    name: "Power 6/55",
    shortName: "Power 6/55",
    region: "VN",
    regionLabel: "Việt Nam",
    iconHint: "655",
    drawSchedule: "18:00 Thứ 3, Thứ 5, Thứ 7",
    numberFormat: "6 số chính + 1 số Power",
    sourceUrl: "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/655",
    accent: "from-rose-500 to-orange-500",
    currency: "VND"
  },
  {
    id: "vietlott_mega_645",
    name: "Mega 6/45",
    shortName: "Mega 6/45",
    region: "VN",
    regionLabel: "Việt Nam",
    iconHint: "645",
    drawSchedule: "18:00 Thứ 4, Thứ 6, Chủ nhật",
    numberFormat: "6 số chính",
    sourceUrl: "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/645",
    accent: "from-cyan-500 to-blue-500",
    currency: "VND"
  },
  {
    id: "vietlott_lotto_535",
    name: "Lotto 5/35",
    shortName: "Lotto 5/35",
    region: "VN",
    regionLabel: "Việt Nam",
    iconHint: "535",
    drawSchedule: "18:00 Thứ 2, Thứ 4, Thứ 6",
    numberFormat: "5 số chính + 1 số đặc biệt",
    sourceUrl: "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/535",
    accent: "from-teal-500 to-emerald-500",
    currency: "VND"
  },
  {
    id: "us_mega_millions",
    name: "Mega Millions",
    shortName: "Mega Millions",
    region: "US",
    regionLabel: "Hoa Kỳ",
    iconHint: "MM",
    drawSchedule: "Thứ 3 và Thứ 6 (giờ Mỹ)",
    numberFormat: "5 số chính + 1 Mega Ball",
    sourceUrl: "https://data.ny.gov/resource/5xaw-6ayf.json",
    accent: "from-amber-500 to-yellow-500",
    currency: "USD"
  },
  {
    id: "eu_euromillions",
    name: "EuroMillions",
    shortName: "EuroMillions",
    region: "EU",
    regionLabel: "Châu Âu",
    iconHint: "EM",
    drawSchedule: "Thứ 3 và Thứ 6 (giờ Châu Âu)",
    numberFormat: "5 số chính + 2 Lucky Stars",
    sourceUrl: "https://euromillions.api.pedromealha.dev/v1/draws",
    accent: "from-indigo-500 to-violet-500",
    currency: "EUR"
  },
  {
    id: "eu_eurojackpot",
    name: "EuroJackpot",
    shortName: "EuroJackpot",
    region: "EU",
    regionLabel: "Châu Âu",
    iconHint: "EJ",
    drawSchedule: "Thứ 3 và Thứ 6 (giờ Châu Âu)",
    numberFormat: "5 số chính + 2 Euro Numbers",
    sourceUrl: "https://www.lottoland.com/api/drawings/euroJackpot",
    accent: "from-sky-500 to-emerald-500",
    currency: "EUR"
  }
];

export function getGame(id: LotteryGameId) {
  return games.find((game) => game.id === id);
}

/**
 * Applies a user-defined ordering, keeping any game the preference does not
 * mention in its default position at the end.
 */
export function orderGames<T extends { id: LotteryGameId }>(list: T[], order: LotteryGameId[] | undefined) {
  if (!order?.length) return list;

  const rank = new Map(order.map((id, index) => [id, index]));
  return [...list].sort(
    (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );
}
