import Link from "next/link";
import type { HistoryResult, LotteryDraw } from "@/lib/lottery/types";
import { formatNetPrize, getNetRate } from "@/lib/lottery/tax";
import { EmptyState } from "@/components/ui/empty-state";
import { NumberBall } from "./NumberBall";
import { SourceBadge } from "./SourceBadge";

export function HistoryTable({ result }: { result: HistoryResult }) {
  if (!result.draws.length) {
    return <EmptyState title="Không có dòng phù hợp" description="Thử đổi game, ngày quay hoặc kỳ quay." />;
  }

  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:hidden">
        {result.draws.map((draw) => (
          <HistoryCard key={`${draw.id}-mobile`} draw={draw} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-background/45 md:block">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-muted/70 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Ngày quay</th>
              <th className="px-4 py-3 font-medium">Kỳ quay</th>
              <th className="px-4 py-3 font-medium">Bộ số</th>
              <th className="px-4 py-3 font-medium">Jackpot</th>
              <th className="px-4 py-3 font-medium">Thực nhận</th>
              <th className="px-4 py-3 font-medium">Nguồn</th>
            </tr>
          </thead>
          <tbody>
            {result.draws.map((draw) => (
              <HistoryRow key={draw.id} draw={draw} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Trang {result.page}/{pages} · {result.total} kỳ quay
        </span>
        <span>{result.pageSize} dòng/trang</span>
      </div>
    </div>
  );
}

function HistoryCard({ draw }: { draw: LotteryDraw }) {
  return (
    <article className="rounded-lg border bg-background/45 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">{draw.drawDate}</div>
          <Link href={`/games/${draw.gameId}`} className="mt-1 block font-semibold hover:underline">
            {draw.drawNo ? `#${draw.drawNo}` : draw.gameName}
          </Link>
        </div>
        <div className="max-w-[42%] overflow-hidden">
          <SourceBadge name={draw.sourceName} url={draw.sourceUrl} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {draw.mainNumbers.map((number, index) => (
          <NumberBall key={`${draw.id}-card-main-${index}`} value={number} />
        ))}
        {draw.specialNumbers?.map((number, index) => (
          <NumberBall key={`${draw.id}-card-special-${index}`} value={number} variant="special" />
        ))}
        {draw.bonusNumbers?.map((number, index) => (
          <NumberBall key={`${draw.id}-card-bonus-${index}`} value={number} variant="bonus" />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-muted/50 p-2">
          <div className="text-xs text-muted-foreground">Jackpot</div>
          <div className="mt-1 font-semibold">{draw.jackpot ?? "Chua cong bo"}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-2">
          <div className="text-xs text-muted-foreground">Thuc nhan</div>
          <div className="mt-1 font-semibold">{formatNetPrize(draw.jackpot, draw)}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{Math.round(getNetRate(draw.gameId) * 100)}% sau thue</div>
        </div>
      </div>
    </article>
  );
}

function HistoryRow({ draw }: { draw: LotteryDraw }) {
  return (
    <tr className="border-t">
      <td className="px-4 py-3">{draw.drawDate}</td>
      <td className="px-4 py-3">
        <Link href={`/games/${draw.gameId}`} className="font-medium hover:underline">
          {draw.drawNo ? `#${draw.drawNo}` : draw.gameName}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {draw.mainNumbers.map((number, index) => (
            <NumberBall key={`${draw.id}-row-main-${index}`} value={number} />
          ))}
          {draw.specialNumbers?.map((number, index) => (
            <NumberBall key={`${draw.id}-row-special-${index}`} value={number} variant="special" />
          ))}
          {draw.bonusNumbers?.map((number, index) => (
            <NumberBall key={`${draw.id}-row-bonus-${index}`} value={number} variant="bonus" />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">{draw.jackpot ?? "Chưa công bố"}</td>
      <td className="px-4 py-3">
        <div className="font-medium">{formatNetPrize(draw.jackpot, draw)}</div>
        <div className="text-xs text-muted-foreground">{Math.round(getNetRate(draw.gameId) * 100)}% sau thuế</div>
      </td>
      <td className="px-4 py-3">
        <SourceBadge name={draw.sourceName} url={draw.sourceUrl} />
      </td>
    </tr>
  );
}
