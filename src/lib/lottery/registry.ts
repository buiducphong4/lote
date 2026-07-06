import type { LotteryAdapter, LotteryGameId } from "./types";
import { createVietlottAdapter } from "./adapters/vietlott";
import { megaMillionsAdapter } from "./adapters/megaMillions";
import { euroMillionsAdapter } from "./adapters/euroMillions";
import { euroJackpotAdapter } from "./adapters/euroJackpot";
import { games } from "./games";

const adapterList: LotteryAdapter[] = [
  createVietlottAdapter("vietlott_lotto_535"),
  createVietlottAdapter("vietlott_power_655"),
  createVietlottAdapter("vietlott_mega_645"),
  megaMillionsAdapter,
  euroMillionsAdapter,
  euroJackpotAdapter
];

export const adapters = new Map<LotteryGameId, LotteryAdapter>(
  adapterList.map((adapter) => [adapter.gameId, adapter])
);

export { games } from "./games";

export function isLotteryGameId(value: string | null | undefined): value is LotteryGameId {
  return Boolean(value && adapters.has(value as LotteryGameId));
}
