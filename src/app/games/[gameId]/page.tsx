import { notFound } from "next/navigation";
import { DrawCard } from "@/components/lottery/DrawCard";
import { HistoryTable } from "@/components/lottery/HistoryTable";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { getGame } from "@/lib/lottery/games";
import { getHistory, getLatest, parseGameId } from "@/lib/lottery/service";

export default async function GameDetailPage({
  params
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId: rawGameId } = await params;
  const gameId = parseGameId(rawGameId);
  if (!gameId) notFound();

  const game = getGame(gameId);
  if (!game) notFound();

  const [latest, history] = await Promise.all([
    getLatest(gameId),
    getHistory(gameId, { page: 1, pageSize: 30 })
  ]);
  const draw = latest.draws[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-muted-foreground">{game.region}</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{game.name}</h1>
          <p className="mt-2 text-muted-foreground">{game.drawSchedule} · {game.numberFormat}</p>
        </div>
        <RefreshButton />
      </div>

      <Warnings warnings={[...latest.warnings, ...history.warnings]} />
      {draw ? <DrawCard draw={draw} featured /> : null}
      <HistoryTable result={history.result} />
    </div>
  );
}
