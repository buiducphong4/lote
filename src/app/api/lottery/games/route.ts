import { NextResponse } from "next/server";
import { getGames } from "@/lib/lottery/service";

export async function GET() {
  return NextResponse.json({ data: await getGames() });
}
