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

/** Until a resolver can see the value, the entry lives on a short lease. */
const PENDING_LEASE_MS = 30 * 1000;

/**
 * `ttlMs` may be a function, for an answer whose shelf life depends on what came back: a draw
 * result is good until the next draw is due, but only if it is the draw we were waiting for.
 */
export function getCached<T>(
  key: string,
  ttlMs: number | ((value: T) => number),
  loader: () => Promise<T>,
  options: CacheOptions = {}
) {
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

  // The lease still collapses the concurrent reads of one render without pinning a stale answer.
  const entry: CacheEntry<T> = {
    storedAt: now,
    expiresAt: now + (typeof ttlMs === "number" ? ttlMs : PENDING_LEASE_MS),
    value
  };
  store.set(key, entry);

  if (typeof ttlMs === "function") {
    value.then(
      (resolved) => {
        // Only extend the entry this call created: a purge in between must stay purged.
        if (store.get(key) === entry) entry.expiresAt = Date.now() + ttlMs(resolved);
      },
      () => {}
    );
  }

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
