export async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": "LoteLotteryDashboard/0.1",
        Accept: "application/json,text/html;q=0.9,*/*;q=0.8",
        ...(init.headers ?? {})
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Source returned ${response.status}`);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}
