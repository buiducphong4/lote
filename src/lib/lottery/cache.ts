type CacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const store = new Map<string, CacheEntry<unknown>>();

export const TTL = {
  latest: 60 * 1000,
  history: 24 * 60 * 60 * 1000
};

export function getCached<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
  const now = Date.now();
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = loader().catch((error) => {
    store.delete(key);
    throw error;
  });

  store.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

export function clearLotteryCache() {
  store.clear();
}
