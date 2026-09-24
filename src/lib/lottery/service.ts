import { getFxRates, type FxRates } from "./fx";
import { adapters, games, isLotteryGameId } from "./registry";
import type { HistoryQuery, LotteryDraw, LotteryGameId } from "./types";

export async function getGames() {
  return games;
}

export { getFxRates };
export type { FxRates };

export async function getLatest(gameId?: LotteryGameId) {
  const selected = gameId ? [adapters.get(gameId)].filter(Boolean) : [...adapters.values()];
  const settled = await Promise.all(
    selected.map(async (adapter) => {
      if (!adapter) return null;
      try {
        return await adapter.getLatest();
      } catch {
        const game = games.find((item) => item.id === adapter.gameId);
        return {
          data: null,
          warnings: [`Không tải được kết quả ${game?.name ?? adapter.gameId} ở thời điểm này.`]
        };
      }
    })
  );

  return {
    draws: settled.flatMap((result) => (result?.data ? [result.data] : [])) as LotteryDraw[],
    warnings: dedupe(settled.flatMap((result) => result?.warnings ?? []))
  };
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
