import type { CurrencyCode, Money } from "./money";

export type LotteryRegion = "VN" | "US" | "EU";

export type LotteryGameId =
  | "vietlott_lotto_535"
  | "vietlott_power_655"
  | "vietlott_mega_645"
  | "us_mega_millions"
  | "eu_euromillions"
  | "eu_eurojackpot";

export type PrizeTier = {
  tier: string;
  match?: string;
  winners?: number | null;
  prize?: Money | null;
};

export type LotteryDraw = {
  id: string;
  gameId: LotteryGameId;
  region: LotteryRegion;
  gameName: string;
  drawDate: string;
  drawNo?: string;
  mainNumbers: number[];
  bonusNumbers?: number[];
  specialNumbers?: number[];
  jackpot?: Money | null;
  jackpot2?: Money | null;
  prizeTable?: PrizeTier[];
  sourceName: string;
  sourceUrl: string;
  updatedAt: string;
};

export type LotteryGame = {
  id: LotteryGameId;
  name: string;
  shortName: string;
  region: LotteryRegion;
  regionLabel: string;
  iconHint: string;
  drawSchedule: string;
  numberFormat: string;
  sourceUrl: string;
  accent: string;
  /** Currency the source publishes prizes in. */
  currency: CurrencyCode;
};

export type AdapterResult<T> = {
  data: T;
  warnings: string[];
};

export type HistoryQuery = {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  search?: string;
};

export type HistoryResult = {
  draws: LotteryDraw[];
  page: number;
  pageSize: number;
  total: number;
};

export type LotteryAdapter = {
  gameId: LotteryGameId;
  getLatest: () => Promise<AdapterResult<LotteryDraw | null>>;
  getHistory: (query?: HistoryQuery) => Promise<AdapterResult<HistoryResult>>;
};
