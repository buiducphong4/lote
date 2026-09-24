import { NextResponse } from "next/server";
import { getFxRates } from "@/lib/lottery/fx";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ data: await getFxRates() });
}
