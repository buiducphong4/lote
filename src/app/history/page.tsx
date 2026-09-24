import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";
import { FxNotice } from "@/components/lottery/FxNotice";
import { GameTabs } from "@/components/lottery/GameTabs";
import { HistoryTable } from "@/components/lottery/HistoryTable";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { Button } from "@/components/ui/button";
import { getGames, getHistory, parseGameId } from "@/lib/lottery/service";

type HistoryParams = { gameId?: string; from?: string; to?: string; search?: string; page?: string };

const PAGE_SIZE = 30;

export default async function HistoryPage({ searchParams }: { searchParams: Promise<HistoryParams> }) {
  const params = await searchParams;
  const games = await getGames();
  const gameId = parseGameId(params.gameId ?? null) ?? games[0].id;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const history = await getHistory(gameId, {
    from: params.from,
    to: params.to,
    search: params.search,
    page,
    pageSize: PAGE_SIZE
  });
  const pages = Math.max(1, Math.ceil(history.result.total / history.result.pageSize));
  const hasFilters = Boolean(params.from || params.to || params.search);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold sm:text-4xl">Lịch sử kết quả</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Lọc theo sản phẩm, khoảng ngày quay hoặc mã kỳ quay.</p>
          <FxNotice className="mt-2" />
        </div>
        <RefreshButton />
      </div>

      <GameTabs
        games={games}
        activeGameId={gameId}
        basePath="/history"
        extraParams={{ from: params.from, to: params.to, search: params.search }}
      />

      <form className="glass grid gap-3 rounded-xl p-3 sm:p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto]" action="/history">
        <input type="hidden" name="gameId" value={gameId} />

        <Field label="Từ ngày">
          <input name="from" type="date" defaultValue={params.from} className={fieldClass} />
        </Field>
        <Field label="Đến ngày">
          <input name="to" type="date" defaultValue={params.to} className={fieldClass} />
        </Field>
        <Field label="Kỳ quay">
          <input
            name="search"
            defaultValue={params.search}
            placeholder="Ví dụ: 01364"
            inputMode="numeric"
            className={fieldClass}
          />
        </Field>

        <Button className="self-end" type="submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Lọc
        </Button>

        {hasFilters ? (
          <Button className="self-end" variant="outline" asChild>
            <Link href={`/history?gameId=${gameId}`}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Xóa lọc
            </Link>
          </Button>
        ) : null}
      </form>

      <Warnings warnings={history.warnings} />
      <HistoryTable result={history.result} />

      <nav className="flex items-center justify-center gap-2 sm:justify-end" aria-label="Phân trang">
        <PageLink params={params} gameId={gameId} page={page - 1} disabled={page <= 1} label="Trước">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Trước
        </PageLink>
        <span className="px-2 text-sm tabular-nums text-muted-foreground">
          {page} / {pages}
        </span>
        <PageLink params={params} gameId={gameId} page={page + 1} disabled={page >= pages} label="Sau">
          Sau
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </PageLink>
      </nav>
    </div>
  );
}

const fieldClass =
  "h-11 rounded-lg border bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function PageLink({
  params,
  gameId,
  page,
  disabled,
  label,
  children
}: {
  params: HistoryParams;
  gameId: string;
  page: number;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  // A disabled control must not stay navigable, so render a real disabled button.
  if (disabled) {
    return (
      <Button variant="outline" disabled aria-label={`${label} (không khả dụng)`}>
        {children}
      </Button>
    );
  }

  return (
    <Button variant="outline" asChild>
      <Link href={buildHistoryHref(params, gameId, page)} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}

function buildHistoryHref(params: HistoryParams, gameId: string, page: number) {
  const next = new URLSearchParams({ gameId });
  for (const key of ["from", "to", "search"] as const) {
    if (params[key]) next.set(key, params[key]);
  }
  if (page > 1) next.set("page", String(page));
  return `/history?${next.toString()}`;
}
