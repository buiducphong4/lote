import { NextRequest, NextResponse } from "next/server";
import { convertDraw } from "@/lib/lottery/convertDraw";
import { isCurrencyCode } from "@/lib/lottery/money";
import { getFxRates, getHistory, parseGameId } from "@/lib/lottery/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const gameId = parseGameId(params.get("gameId"));

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "30");
  const currencyParam = params.get("currency");
  const currency = isCurrencyCode(currencyParam) ? currencyParam : null;

  const { result, warnings } = await getHistory(gameId, {
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    search: params.get("search") ?? undefined,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 30
  });

  if (!currency) {
    return NextResponse.json({ data: result, warnings });
  }

  const fx = await getFxRates();
  return NextResponse.json({
    data: { ...result, draws: result.draws.map((draw) => convertDraw(draw, currency, fx.rates)) },
    warnings,
    fx
  });
}
