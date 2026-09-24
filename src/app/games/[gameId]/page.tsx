import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink } from "lucide-react";
import { DrawCard } from "@/components/lottery/DrawCard";
import { FxNotice } from "@/components/lottery/FxNotice";
import { HistoryTable } from "@/components/lottery/HistoryTable";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getGame } from "@/lib/lottery/games";
import { getHistory, getLatest, parseGameId } from "@/lib/lottery/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GameDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId: rawGameId } = await params;
  const gameId = parseGameId(rawGameId);
  if (!gameId) notFound();

  const game = getGame(gameId);
  if (!game) notFound();

  const [latest, history] = await Promise.all([
    getLatest(gameId),
    getHistory(gameId, { page: 1, pageSize: 10 })
  ]);
  const draw = latest.draws[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${game.accent} text-sm font-bold text-white`}
            aria-hidden="true"
          >
            {game.iconHint}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{game.regionLabel}</p>
            <h1 className="text-2xl font-semibold sm:text-4xl">{game.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {game.drawSchedule} · {game.numberFormat}
            </p>
            <FxNotice className="mt-2" />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" asChild>
            <a href={game.sourceUrl} target="_blank" rel="noreferrer">
              Nguồn
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
          <RefreshButton />
        </div>
      </div>

      <Warnings warnings={[...latest.warnings, ...history.warnings]} />

      {draw ? (
        <DrawCard draw={draw} featured />
      ) : (
        <EmptyState title="Chưa có kết quả" description="Nguồn dữ liệu chưa trả về kỳ quay mới nhất." />
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Các kỳ quay gần đây</h2>
          <Button variant="ghost" asChild>
            <Link href={`/history?gameId=${game.id}`}>
              Xem tất cả
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <HistoryTable result={history.result} />
      </section>
    </div>
  );
}
