import { getCached } from "./cache";
import { getFxRates, type FxRates } from "./fx";
import { latestTtlMs } from "./schedule";
import { adapters, games, isLotteryGameId } from "./registry";
import type { HistoryQuery, LotteryAdapter, LotteryDraw, LotteryGameId, NextDraw } from "./types";

export async function getGames() {
  return games;
}

export { getFxRates };
export type { FxRates };

/**
 * One unreachable source must not hold the whole page. Each adapter gets a slice of wall clock;
 * past it the page renders with whatever arrived and says plainly what is missing. Without this a
 * single dead upstream turned the dashboard into a minute of loading skeletons.
 */
const ADAPTER_BUDGET_MS = 9000;

function withinBudget<T>(work: Promise<T>, fallback: T, budgetMs = ADAPTER_BUDGET_MS) {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), budgetMs);
    const settle = (value: T) => {
      clearTimeout(timer);
      resolve(value);
    };

    // The slow request is left running: it still warms the cache for the next reader.
    work.then(settle, () => settle(fallback));
  });
}

export async function getLatest(gameId?: LotteryGameId) {
  const selected = gameId ? [adapters.get(gameId)].filter(Boolean) : [...adapters.values()];
  const settled = await Promise.all(
    selected.map(async (adapter) => {
      if (!adapter) return null;

      const game = games.find((item) => item.id === adapter.gameId);
      const unavailable = {
        data: null,
        warnings: [`Không tải được kết quả ${game?.name ?? adapter.gameId} ở thời điểm này.`]
      };

      // The upcoming jackpot is a bonus: a source that cannot supply it must not sink the result.
      const [latest, next] = await Promise.all([
        withinBudget(cachedLatest(adapter), unavailable),
        withinBudget(adapter.getNext?.() ?? Promise.resolve(null), null)
      ]);

      return { latest, next };
    })
  );

  return {
    draws: settled.flatMap((result) => (result?.latest.data ? [result.latest.data] : [])) as LotteryDraw[],
    nextDraws: settled.flatMap((result) => (result?.next?.data ? [result.next.data] : [])) as NextDraw[],
    warnings: dedupe(settled.flatMap((result) => result?.latest.warnings ?? []))
  };
}

/**
 * Holds a game's latest draw for as long as its schedule says nothing can change. A failed load is
 * held briefly instead, so a source that comes back is picked up without a wait, and never pinned
 * for the hours a real result would earn.
 */
const FAILED_LOAD_TTL_MS = 60 * 1000;

function cachedLatest(adapter: LotteryAdapter) {
  return getCached(
    `schedule:${adapter.gameId}`,
    (result) => (result.data ? latestTtlMs(adapter.gameId, result.data.drawDate) : FAILED_LOAD_TTL_MS),
    () => adapter.getLatest()
  );
}

export async function getHistory(gameId: LotteryGameId, query: HistoryQuery) {
  const adapter = adapters.get(gameId);
  if (!adapter) {
    return {
      result: { draws: [], page: query.page ?? 1, pageSize: query.pageSize ?? 30, total: 0 },
      warnings: ["Sản phẩm xổ số không hợp lệ."]
    };
  }

  try {
    const { data, warnings } = await adapter.getHistory(query);
    return { result: data, warnings: dedupe(warnings) };
  } catch {
    return {
      result: { draws: [], page: query.page ?? 1, pageSize: query.pageSize ?? 30, total: 0 },
      warnings: ["Không tải được lịch sử ở thời điểm này, vui lòng thử lại sau."]
    };
  }
}

export function parseGameId(value: string | null) {
  return isLotteryGameId(value) ? value : undefined;
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
