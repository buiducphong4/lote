import { NextRequest, NextResponse } from "next/server";
import { getLatest, parseGameId } from "@/lib/lottery/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const gameId = parseGameId(request.nextUrl.searchParams.get("gameId"));
  const result = await getLatest(gameId);

  return NextResponse.json({
    data: gameId ? result.draws[0] ?? null : result.draws,
    warnings: result.warnings
  });
}
