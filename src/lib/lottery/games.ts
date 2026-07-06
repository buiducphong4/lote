import type { LotteryGame, LotteryGameId } from "./types";

export const games: LotteryGame[] = [
  {
    id: "vietlott_lotto_535",
    name: "Lotto 5/35",
    shortName: "Lotto 5/35",
    region: "VN",
    iconHint: "535",
    drawSchedule: "Vietlott, theo lịch công bố",
    numberFormat: "5 số chính + số đặc biệt",
    sourceUrl: "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/535",
    accent: "from-teal-500 to-emerald-500"
  },
  {
    id: "vietlott_power_655",
    name: "Power 6/55",
    shortName: "Power 6/55",
    region: "VN",
    iconHint: "655",
    drawSchedule: "18:00 Thứ 3, Thứ 5, Thứ 7",
    numberFormat: "6 số chính + số Power",
    sourceUrl: "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/655",
    accent: "from-sky-500 to-teal-500"
  },
  {
    id: "vietlott_mega_645",
    name: "Mega 6/45",
    shortName: "Mega 6/45",
    region: "VN",
    iconHint: "645",
    drawSchedule: "18:00 Thứ 4, Thứ 6, Chủ nhật",
    numberFormat: "6 số chính",
    sourceUrl: "https://vietlott.vn/vi/trung-thuong/ket-qua-trung-thuong/645",
    accent: "from-cyan-500 to-blue-500"
  },
  {
    id: "us_mega_millions",
    name: "Mega Millions",
    shortName: "Mega Millions",
    region: "US",
    iconHint: "MM",
    drawSchedule: "Thứ 3 và Thứ 6 theo giờ Mỹ",
    numberFormat: "5 số chính + Mega Ball",
    sourceUrl: "https://data.ny.gov/resource/5xaw-6ayf.json",
    accent: "from-rose-500 to-amber-500"
  },
  {
    id: "eu_euromillions",
    name: "EuroMillions",
    shortName: "EuroMillions",
    region: "EU",
    iconHint: "EU",
    drawSchedule: "Thứ 3 và Thứ 6 theo giờ Châu Âu",
    numberFormat: "5 số chính + 2 Lucky Stars",
    sourceUrl: "https://euromillions.api.pedromealha.dev/v1/draws",
    accent: "from-indigo-500 to-teal-500"
  },
  {
    id: "eu_eurojackpot",
    name: "EuroJackpot",
    shortName: "EuroJackpot",
    region: "EU",
    iconHint: "EJ",
    drawSchedule: "Thu 3 va Thu 6 theo gio Chau Au",
    numberFormat: "5 so chinh + 2 Euro Numbers",
    sourceUrl: "https://www.lottoland.com/api/drawings/euroJackpot",
    accent: "from-amber-500 to-emerald-500"
  }
];

export function getGame(id: LotteryGameId) {
  return games.find((game) => game.id === id);
}
