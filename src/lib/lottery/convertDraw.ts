import { convertMoney, type CurrencyCode, type Money } from "./money";
import type { LotteryDraw } from "./types";

/**
 * Restates every prize on a draw in one currency, for API consumers that want a
 * single unit instead of each source's native currency.
 */
export function convertDraw(draw: LotteryDraw, target: CurrencyCode, rates: Record<CurrencyCode, number>): LotteryDraw {
  const convert = (value: Money | null | undefined) => (value ? convertMoney(value, target, rates) : value ?? null);

  return {
    ...draw,
    jackpot: convert(draw.jackpot),
    jackpot2: convert(draw.jackpot2),
    prizeTable: draw.prizeTable?.map((row) => ({ ...row, prize: convert(row.prize) }))
  };
}
