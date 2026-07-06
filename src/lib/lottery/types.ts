export type LotteryRegion = "VN" | "US" | "EU";

export type LotteryGameId =
  | "vietlott_lotto_535"
  | "vietlott_power_655"
  | "vietlott_mega_645"
  | "us_mega_millions"
  | "eu_euromillions"
  | "eu_eurojackpot";

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
  jackpot?: string | number | null;
  jackpot2?: string | number | null;
  prizeTable?: {
    tier: string;
    match?: string;
    winners?: number | null;
    prize?: string | number | null;
  }[];
  sourceName: string;
  sourceUrl: string;
  updatedAt: string;
};

export type LotteryGame = {
  id: LotteryGameId;
  name: string;
  shortName: string;
  region: LotteryRegion;
  iconHint: string;
  drawSchedule: string;
  numberFormat: string;
  sourceUrl: string;
  accent: string;
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
