import { NextRequest, NextResponse } from "next/server";
import { convertDraw } from "@/lib/lottery/convertDraw";
import { isCurrencyCode } from "@/lib/lottery/money";
import { getFxRates, getLatest, parseGameId } from "@/lib/lottery/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const gameId = parseGameId(request.nextUrl.searchParams.get("gameId"));
  const currencyParam = request.nextUrl.searchParams.get("currency");
  const currency = isCurrencyCode(currencyParam) ? currencyParam : null;

  const [result, fx] = await Promise.all([getLatest(gameId), getFxRates()]);
  const draws = currency ? result.draws.map((draw) => convertDraw(draw, currency, fx.rates)) : result.draws;

  return NextResponse.json({
    data: gameId ? draws[0] ?? null : draws,
    warnings: result.warnings,
    fx: currency ? fx : undefined
  });
}
