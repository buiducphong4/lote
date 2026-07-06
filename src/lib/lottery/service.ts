import { adapters, games, isLotteryGameId } from "./registry";
import type { HistoryQuery, LotteryDraw, LotteryGameId } from "./types";

export async function getGames() {
  return games;
}

export async function getLatest(gameId?: LotteryGameId) {
  const warnings: string[] = [];
  const selected = gameId ? [adapters.get(gameId)].filter(Boolean) : [...adapters.values()];
  const settled = await Promise.all(
    selected.map(async (adapter) => {
      if (!adapter) return null;
      const result = await adapter.getLatest();
      warnings.push(...result.warnings);
      return result.data;
    })
  );

  return {
    draws: settled.filter(Boolean) as LotteryDraw[],
    warnings
  };
}

export async function getHistory(gameId: LotteryGameId, query: HistoryQuery) {
  const adapter = adapters.get(gameId);
  if (!adapter) {
    return {
      result: { draws: [], page: query.page ?? 1, pageSize: query.pageSize ?? 30, total: 0 },
      warnings: ["Game không hợp lệ."]
    };
  }

  const { data, warnings } = await adapter.getHistory(query);
  return { result: data, warnings };
}

export function parseGameId(value: string | null) {
  return isLotteryGameId(value) ? value : undefined;
}
