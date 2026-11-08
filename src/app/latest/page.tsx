import { DrawCard } from "@/components/lottery/DrawCard";
import { FxNotice } from "@/components/lottery/FxNotice";
import { GameTabs } from "@/components/lottery/GameTabs";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { EmptyState } from "@/components/ui/empty-state";
import { getGame } from "@/lib/lottery/games";
import { getGames, getLatest, parseGameId } from "@/lib/lottery/service";

/**
 * The game tab lives in the query string, so this page is rendered per request rather than served
 * from a prerender the way the dashboard is. It still rides the same caches underneath: getLatest
 * holds each game's result for as long as its draw schedule says nothing can change.
 */
export const revalidate = 120;

export default async function LatestPage({
  searchParams
}: {
  searchParams: Promise<{ gameId?: string }>;
}) {
  const params = await searchParams;
  const games = await getGames();
  const activeGameId = parseGameId(params.gameId ?? null) ?? games[0].id;
  const activeGame = getGame(activeGameId);
  const latest = await getLatest(activeGameId);
  const draw = latest.draws[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-4xl">Kết quả mới nhất</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {activeGame ? `${activeGame.drawSchedule} · ${activeGame.numberFormat}` : "Chọn một sản phẩm để xem kỳ quay mới nhất."}
          </p>
          <FxNotice className="mt-2" />
        </div>
        <RefreshButton />
      </div>

      <GameTabs games={games} activeGameId={activeGameId} basePath="/latest" />
      <Warnings warnings={latest.warnings} />

      {draw ? (
        <DrawCard draw={draw} next={latest.nextDraws[0]} featured />
      ) : (
        <EmptyState title="Chưa có kết quả" description="Nguồn dữ liệu chưa trả về kết quả hợp lệ cho sản phẩm này." />
      )}
    </div>
  );
}
