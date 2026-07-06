import { DrawCard } from "@/components/lottery/DrawCard";
import { GameTabs } from "@/components/lottery/GameTabs";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { EmptyState } from "@/components/ui/empty-state";
import { getGames, getLatest, parseGameId } from "@/lib/lottery/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LatestPage({
  searchParams
}: {
  searchParams: Promise<{ gameId?: string }>;
}) {
  const params = await searchParams;
  const games = await getGames();
  const activeGameId = parseGameId(params.gameId ?? null) ?? games[0].id;
  const latest = await getLatest(activeGameId);
  const draw = latest.draws[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Kết quả mới nhất</h1>
          <p className="mt-2 text-muted-foreground">Chọn một sản phẩm để xem kỳ quay mới nhất.</p>
        </div>
        <RefreshButton />
      </div>
      <GameTabs games={games} activeGameId={activeGameId} basePath="/latest" />
      <Warnings warnings={latest.warnings} />
      {draw ? (
        <DrawCard draw={draw} featured />
      ) : (
        <EmptyState title="Chưa có kết quả" description="Nguồn dữ liệu chưa trả về kết quả hợp lệ." />
      )}
    </div>
  );
}
