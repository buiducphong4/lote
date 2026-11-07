import { getCached, TTL } from "../cache";
import { fetchWithTimeout } from "../fetcher";
import { drawInstant } from "../drawTime";
import { money } from "../money";
import type { LotteryGameId, NextDraw } from "../types";

/**
 * Lottoland's drawing feeds carry a `next` block with the operator's advertised jackpot for the
 * upcoming draw, written in whole millions of euro. That is the headline figure lottery sites
 * show, so it is what a reader comparing our card against those sites expects to see.
 */
export async function fetchLottolandNext(
  gameId: LotteryGameId,
  endpoint: string,
  referer: string
): Promise<NextDraw | null> {
  return getCached(`next:${gameId}`, TTL.upstream, async () => {
    const response = await fetchWithTimeout(endpoint, { headers: { Referer: referer } });
    const payload = (await response.json()) as Record<string, unknown>;
    const row = firstRecord(payload.next);
    const date = firstRecord(row.date);
    const day = toNumber(date.day);
    const month = toNumber(date.month);
    const year = toNumber(date.year);

    if (!day || !month || !year) return null;

    const millions = toNumber(row.marketingJackpot) ?? toNumber(row.jackpot);
    const drawNo = toNumber(row.nr);
    const drawDate = `${year}-${pad(month)}-${pad(day)}`;
    // Lottoland reports the draw clock in its own Central European time.
    const drawAt = drawInstant(drawDate, toNumber(date.hour) ?? 0, toNumber(date.minute) ?? 0, "Europe/Berlin");

    return {
      gameId,
      drawDate,
      drawAt: drawAt ?? undefined,
      drawNo: drawNo ? String(drawNo) : undefined,
      jackpot: millions ? money(millions * 1_000_000, "EUR") : null,
      sourceName: "Lottoland",
      sourceUrl: endpoint,
      updatedAt: new Date().toISOString()
    };
  });
}

function firstRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return firstRecord(value[0]);
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
