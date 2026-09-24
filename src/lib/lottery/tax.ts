import { money, type Money } from "./money";
import type { LotteryGameId } from "./types";

/** Share of a prize the winner keeps after the local withholding rate. */
const NET_RATES: Record<LotteryGameId, number> = {
  vietlott_lotto_535: 0.9,
  vietlott_power_655: 0.9,
  vietlott_mega_645: 0.9,
  eu_euromillions: 0.8,
  eu_eurojackpot: 0.8,
  us_mega_millions: 0.3
};

const TAX_NOTES: Record<LotteryGameId, string> = {
  vietlott_lotto_535: "Thuế thu nhập cá nhân 10% với phần thưởng vượt 10 triệu đồng.",
  vietlott_power_655: "Thuế thu nhập cá nhân 10% với phần thưởng vượt 10 triệu đồng.",
  vietlott_mega_645: "Thuế thu nhập cá nhân 10% với phần thưởng vượt 10 triệu đồng.",
  eu_euromillions: "Ước tính sau thuế trung bình của các nước tham gia (khoảng 20%).",
  eu_eurojackpot: "Ước tính sau thuế trung bình của các nước tham gia (khoảng 20%).",
  us_mega_millions: "Ước tính sau thuế liên bang, thuế bang và chiết khấu nhận một lần (còn ~30%)."
};

export function getNetRate(gameId: LotteryGameId) {
  return NET_RATES[gameId];
}

export function getNetRatePercent(gameId: LotteryGameId) {
  return Math.round(getNetRate(gameId) * 100);
}

export function getTaxNote(gameId: LotteryGameId) {
  return TAX_NOTES[gameId];
}

export function toNetMoney(value: Money | null | undefined, gameId: LotteryGameId): Money | null {
  if (!value) return null;
  return money(value.amount * getNetRate(gameId), value.currency);
}
