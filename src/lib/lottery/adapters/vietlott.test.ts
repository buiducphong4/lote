import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLotteryCache } from "../cache";
import { clearHostCooldowns } from "../fetcher";
import { createVietlottAdapter } from "./vietlott";

/** The front page hours before the draw: balls rendered but empty, jackpot masked. */
const pendingPage = `
<article class="vk vkt-mega">
  <header class="vk-dai">
    <div class="vk-ten"><h2>Mega 6/45</h2><p>Trực tiếp Chủ nhật ngày 08/11/2026, 18 giờ</p></div>
    <a class="vk-kyve"><small>Kỳ vé</small><b class="kyve">#01586</b></a>
  </header>
  <ul class="vk-bong">
    <li><span class="kq" data=""></span></li><li><span class="kq" data=""></span></li>
    <li><span class="kq" data=""></span></li><li><span class="kq" data=""></span></li>
    <li><span class="kq" data=""></span></li><li><span class="kq" data=""></span></li>
  </ul>
  <p class="vk-jp"><span class="jackpot" data="***********">***********</span></p>
</article>
<a href="/kqxs-mega-645-ngay-08-11-2026">08/11</a>
<a href="/kqxs-mega-645-ngay-06-11-2026">06/11</a>
<a href="/kqxs-mega-645-ngay-04-11-2026">04/11</a>
`;

/** A dated page: no animation hooks, values printed straight into the markup. */
const datedPage = `
<article class="vk vkt-mega">
  <header class="vk-dai">
    <div class="vk-ten"><h2>Mega 6/45</h2><p>Mở thưởng 18 giờ, thứ sáu ngày 06/11/2026</p></div>
    <a class="vk-kyve"><small>Kỳ vé</small><b>#01585</b></a>
  </header>
  <ul class="vk-bong"><li>01</li><li>10</li><li>37</li><li>38</li><li>39</li><li>45</li></ul>
  <p class="vk-jp"><span>Jackpot kỳ này</span><strong>13.783.788.500đ</strong></p>
  <table class="vk-giai"><tbody>
    <tr><th scope="row">Jackpot</th><td><span aria-label="Trùng 6 số"></span></td><td>0</td><td>13.783.788.500</td></tr>
    <tr><th scope="row">Giải Nhất</th><td><span aria-label="Trùng 5 số"></span></td><td>20</td><td>10.000.000</td></tr>
  </tbody></table>
</article>
`;

function stubSources(pages: Record<string, string>) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: unknown) => {
      const url = String(input);
      calls.push(url);
      // vietlott.vn only answers Vietnamese IPs; a deployed server never gets past it.
      if (url.includes("vietlott.vn")) throw new Error("blocked");
      const key = Object.keys(pages).find((path) => url.includes(path));
      if (!key) throw new Error(`unexpected request: ${url}`);
      return new Response(pages[key], { status: 200, headers: { "Content-Type": "text/html" } });
    })
  );
  return calls;
}

describe("Vietlott via Minh Ngoc", () => {
  beforeEach(() => {
    clearLotteryCache();
    clearHostCooldowns();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearLotteryCache();
    clearHostCooldowns();
  });

  it("skips a draw that has not been held yet and reads the newest dated page instead", async () => {
    const calls = stubSources({
      "xosominhngoc.net.vn/mega": pendingPage,
      "ngay-08-11-2026": pendingPage,
      "ngay-06-11-2026": datedPage
    });

    const { data } = await createVietlottAdapter("vietlott_mega_645").getLatest();

    expect(data?.drawDate).toBe("2026-11-06");
    expect(data?.drawNo).toBe("01585");
    // The pending block would have produced six zeroes here.
    expect(data?.mainNumbers).toEqual([1, 10, 37, 38, 39, 45]);
    expect(data?.jackpot).toEqual({ amount: 13_783_788_500, currency: "VND" });
    expect(data?.prizeTable?.[0]).toMatchObject({ tier: "Jackpot", winners: 0 });
    expect(calls.some((url) => url.includes("ngay-04-11-2026"))).toBe(false);
  });

  it("reads the front page directly once the draw has happened", async () => {
    const calls = stubSources({ "xosominhngoc.net.vn/mega": datedPage });

    const { data } = await createVietlottAdapter("vietlott_mega_645").getLatest();

    expect(data?.mainNumbers).toEqual([1, 10, 37, 38, 39, 45]);
    expect(calls.filter((url) => url.includes("xosominhngoc")).length).toBe(1);
  });
});
