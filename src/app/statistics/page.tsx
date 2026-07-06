import Link from "next/link";
import { GameTabs } from "@/components/lottery/GameTabs";
import { StatisticsPanel } from "@/components/lottery/StatisticsPanel";
import { Warnings } from "@/components/lottery/Warnings";
import { Button } from "@/components/ui/button";
import { getGames, getHistory, parseGameId } from "@/lib/lottery/service";

export default async function StatisticsPage({
  searchParams
}: {
  searchParams: Promise<{ gameId?: string }>;
}) {
  const params = await searchParams;
  const games = await getGames();
  const activeGameId = parseGameId(params.gameId ?? null) ?? games[0].id;
  const history = await getHistory(activeGameId, { page: 1, pageSize: 200 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Thống kê</h1>
          <p className="mt-2 text-muted-foreground">Tần suất, lần xuất hiện gần nhất, nhóm hot/cold theo lịch sử đã tải.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/games/${activeGameId}`}>Chi tiết game</Link>
        </Button>
      </div>
      <GameTabs games={games} activeGameId={activeGameId} basePath="/statistics" />
      <Warnings warnings={history.warnings} />
      <StatisticsPanel draws={history.result.draws} />
    </div>
  );
}
