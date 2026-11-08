import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearHostCooldowns, fetchWithTimeout } from "./fetcher";

const url = "https://example.test/draws";
const other = "https://example.test/draws?year=2026";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    clearHostCooldowns();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearHostCooldowns();
  });

  it("aborts a hanging request and then skips the host without calling it again", async () => {
    // A request that never resolves on its own, exactly like the dead upstream this guards against.
    const fetchMock = vi.fn((_input: unknown, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithTimeout(url, {}, 20)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The second URL sits on the same host, so the cooldown spares it the whole timeout.
    await expect(fetchWithTimeout(other, {}, 20)).rejects.toThrow(/unreachable/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lets a refresh give the host another chance", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithTimeout(url, {}, 20)).rejects.toThrow();
    clearHostCooldowns();

    await expect(fetchWithTimeout(url, {}, 20)).resolves.toBeInstanceOf(Response);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not cool a host down over an HTTP status: it answered, another path may work", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithTimeout(url, {}, 20)).rejects.toThrow(/429/);
    await expect(fetchWithTimeout(other, {}, 20)).resolves.toBeInstanceOf(Response);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
