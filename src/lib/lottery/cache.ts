type CacheEntry<T> = {
  storedAt: number;
  expiresAt: number;
  value: Promise<T>;
};

type CacheOptions = {
  /**
   * Treat an entry older than this as a miss even though its TTL has not run out.
   * Lets a "latest draw" read demand fresh data from a payload that history caches for a day.
   */
  maxAgeMs?: number;
};

const store = new Map<string, CacheEntry<unknown>>();

export const TTL = {
  /** Memoises the work behind one "latest draw" render. */
  latest: 60 * 1000,
  /**
   * How stale an upstream payload may be when it feeds a "latest draw" read. Draws land twice a
   * week, and several sources answer 429 under tighter polling, so minutes are plenty.
   */
  upstream: 10 * 60 * 1000,
  history: 24 * 60 * 60 * 1000
};

export function getCached<T>(key: string, ttlMs: number, loader: () => Promise<T>, options: CacheOptions = {}) {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;
  const maxAgeMs = options.maxAgeMs ?? Number.POSITIVE_INFINITY;

  if (existing && existing.expiresAt > now && now - existing.storedAt <= maxAgeMs) {
    return existing.value;
  }

  const value = loader().catch((error) => {
    store.delete(key);
    throw error;
  });

  store.set(key, { storedAt: now, expiresAt: now + ttlMs, value });
  return value;
}

export function clearLotteryCache() {
  store.clear();
}

/**
 * Drops what a "latest draw" read depends on, so a manual refresh really goes back to the source.
 * History pages are left alone: rebuilding them means thousands of rows and, for Vietlott, one
 * detail request per draw.
 */
export function clearLatestLotteryCache() {
  for (const key of [...store.keys()]) {
    if (key.startsWith("history:") || key.startsWith("vietlott-detail:")) continue;
    store.delete(key);
  }
}
