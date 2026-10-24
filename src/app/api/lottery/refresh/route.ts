import { NextResponse } from "next/server";
import { clearLatestLotteryCache } from "@/lib/lottery/cache";

export const dynamic = "force-dynamic";

/** Upstream sources rate-limit hard, so keep a floor between purges anyone can trigger. */
const COOLDOWN_MS = 20 * 1000;
let lastClearedAt = 0;

export async function POST() {
  const now = Date.now();
  const elapsed = now - lastClearedAt;

  if (elapsed < COOLDOWN_MS) {
    return NextResponse.json({ cleared: false, retryAfterMs: COOLDOWN_MS - elapsed });
  }

  lastClearedAt = now;
  clearLatestLotteryCache();
  return NextResponse.json({ cleared: true });
}
