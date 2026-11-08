/**
 * A host that times out or refuses the connection is almost never back on the very next request,
 * and several adapters chain two URLs on the same host. Remembering the failure for a minute turns
 * what would be a second full timeout into an instant miss, so one dead source costs seconds
 * instead of tens of seconds.
 *
 * Only connection-level failures count. An HTTP error means the host is answering, and another
 * path on it may well work.
 */
export const UPSTREAM_CACHE_TAG = "lottery-upstream";
const UPSTREAM_REVALIDATE_SECONDS = 60;

const HOST_COOLDOWN_MS = 60 * 1000;
const coolingHosts = new Map<string, number>();

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 12000) {
  const host = hostOf(url);
  const coolingUntil = coolingHosts.get(host);

  if (coolingUntil && coolingUntil > Date.now()) {
    throw new Error(`Skipping ${host}: unreachable moments ago.`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "User-Agent": "LoteLotteryDashboard/0.1",
          Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
          ...(init.headers ?? {})
        },
        // `revalidate: 0` here would opt every page that renders a draw out of static generation,
        // and those pages are what lets a cold instance answer without waiting on anything. Our own
        // schedule-aware cache decides when a request is worth making; this layer only has to not
        // stand in the way. The tag lets a deliberate refresh clear it.
        next: { revalidate: UPSTREAM_REVALIDATE_SECONDS, tags: [UPSTREAM_CACHE_TAG] }
      });
    } catch (error) {
      // Aborted by our own timeout, DNS failure, refused connection: nothing came back at all.
      coolingHosts.set(host, Date.now() + HOST_COOLDOWN_MS);
      throw error;
    }

    coolingHosts.delete(host);

    if (!response.ok) {
      throw new Error(`Source returned ${response.status}`);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/** Lets a manual refresh retry a host that is cooling down. */
export function clearHostCooldowns() {
  coolingHosts.clear();
}
