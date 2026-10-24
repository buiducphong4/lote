import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLotteryCache, getCached, TTL } from "./cache";

describe("getCached", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearLotteryCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reuses an entry while its TTL holds", async () => {
    const loader = vi.fn(async () => "first");
    expect(await getCached("key", TTL.history, loader)).toBe("first");

    vi.advanceTimersByTime(60 * 60 * 1000);
    loader.mockResolvedValue("second");
    expect(await getCached("key", TTL.history, loader)).toBe("first");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("refetches a long-lived entry when the caller demands a fresher one", async () => {
    const loader = vi.fn(async () => "draw-84");
    // History populates the payload with a 24h TTL…
    expect(await getCached("raw:draws", TTL.history, loader)).toBe("draw-84");

    vi.advanceTimersByTime(TTL.latest + 1);
    loader.mockResolvedValue("draw-85");

    // …but "latest" must not be served that day-old copy.
    expect(await getCached("raw:draws", TTL.history, loader, { maxAgeMs: TTL.latest })).toBe("draw-85");
    expect(loader).toHaveBeenCalledTimes(2);

    // The refreshed entry still serves history for a full day.
    expect(await getCached("raw:draws", TTL.history, loader)).toBe("draw-85");
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("keeps an entry that is still inside the requested max age", async () => {
    const loader = vi.fn(async () => "fresh");
    await getCached("raw:draws", TTL.history, loader, { maxAgeMs: TTL.latest });

    vi.advanceTimersByTime(TTL.latest - 1_000);
    await getCached("raw:draws", TTL.history, loader, { maxAgeMs: TTL.latest });
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("drops a rejected entry so the next call retries", async () => {
    const loader = vi.fn(async () => {
      throw new Error("source down");
    });

    await expect(getCached("key", TTL.history, loader)).rejects.toThrow("source down");
    await expect(getCached("key", TTL.history, loader)).rejects.toThrow("source down");
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
