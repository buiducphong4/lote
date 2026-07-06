import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { HistoryTable } from "@/components/lottery/HistoryTable";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { Button } from "@/components/ui/button";
import { getGames, getHistory, parseGameId } from "@/lib/lottery/service";

export default async function HistoryPage({
  searchParams
}: {
  searchParams: Promise<{ gameId?: string; from?: string; to?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const games = await getGames();
  const gameId = parseGameId(params.gameId ?? null) ?? games[0].id;
  const page = Math.max(1, Number(params.page ?? "1"));
  const history = await getHistory(gameId, {
    from: params.from,
    to: params.to,
    search: params.search,
    page,
    pageSize: 30
  });
  const pages = Math.max(1, Math.ceil(history.result.total / history.result.pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Lịch sử kết quả</h1>
          <p className="mt-2 text-muted-foreground">Lọc theo game, ngày quay hoặc mã kỳ quay.</p>
        </div>
        <RefreshButton />
      </div>

      <form className="glass grid gap-3 rounded-lg p-3 sm:p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]" action="/history">
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Game</span>
          <select name="gameId" defaultValue={gameId} className="h-11 rounded-lg border bg-background px-3">
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Từ ngày</span>
          <input name="from" type="date" defaultValue={params.from} className="h-11 rounded-lg border bg-background px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Đến ngày</span>
          <input name="to" type="date" defaultValue={params.to} className="h-11 rounded-lg border bg-background px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Kỳ quay</span>
          <input name="search" defaultValue={params.search} placeholder="01364" className="h-11 rounded-lg border bg-background px-3" />
        </label>
        <Button className="self-end" type="submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Lọc
        </Button>
      </form>

      <Warnings warnings={history.warnings} />
      <HistoryTable result={history.result} />

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={makeHistoryHref(params, Math.max(1, page - 1))} aria-disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Trước
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={makeHistoryHref(params, Math.min(pages, page + 1))} aria-disabled={page >= pages}>
            Sau
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function makeHistoryHref(params: Record<string, string | undefined>, page: number) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  next.set("page", String(page));
  return `/history?${next.toString()}`;
}
