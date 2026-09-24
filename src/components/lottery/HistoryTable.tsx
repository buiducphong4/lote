"use client";

import Link from "next/link";
import { getNetRatePercent, toNetMoney } from "@/lib/lottery/tax";
import type { HistoryResult, LotteryDraw } from "@/lib/lottery/types";
import { EmptyState } from "@/components/ui/empty-state";
import { NumberSet } from "./NumberBall";
import { PrizeAmount, PrizeText } from "./PrizeAmount";
import { SourceBadge } from "./SourceBadge";

export function HistoryTable({ result }: { result: HistoryResult }) {
  if (!result.draws.length) {
    return <EmptyState title="Không có kỳ quay phù hợp" description="Thử đổi sản phẩm, khoảng ngày hoặc mã kỳ quay." />;
  }

  const pages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:hidden">
        {result.draws.map((draw) => (
          <HistoryCard key={`${draw.id}-mobile`} draw={draw} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border bg-background/50 md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Ngày quay</th>
              <th scope="col" className="px-4 py-3 font-medium">Kỳ quay</th>
              <th scope="col" className="px-4 py-3 font-medium">Bộ số</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Jackpot</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Thực nhận</th>
              <th scope="col" className="px-4 py-3 font-medium">Nguồn</th>
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
          Trang {result.page}/{pages} · {new Intl.NumberFormat("vi-VN").format(result.total)} kỳ quay
        </span>
        <span>{result.pageSize} dòng/trang</span>
      </div>
    </div>
  );
}

function HistoryCard({ draw }: { draw: LotteryDraw }) {
  return (
    <article className="rounded-xl border bg-background/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{formatDate(draw.drawDate)}</div>
          <Link href={`/games/${draw.gameId}`} className="mt-0.5 block truncate font-semibold hover:underline">
            {draw.drawNo ? `#${draw.drawNo}` : draw.gameName}
          </Link>
        </div>
        <div className="max-w-[45%] overflow-hidden">
          <SourceBadge name={draw.sourceName} url={draw.sourceUrl} />
        </div>
      </div>

      <NumberSet draw={draw} size="sm" className="mt-2.5" />

      <div className="mt-2.5 grid grid-cols-2 gap-2 text-sm">
        <div className="min-w-0 rounded-lg bg-muted/50 p-2">
          <div className="text-xs text-muted-foreground">Jackpot</div>
          <PrizeAmount value={draw.jackpot} className="mt-0.5 font-semibold tabular-nums" />
        </div>
        <div className="min-w-0 rounded-lg bg-muted/50 p-2">
          <div className="text-xs text-muted-foreground">Thực nhận</div>
          <PrizeAmount
            value={toNetMoney(draw.jackpot, draw.gameId)}
            className="mt-0.5 font-semibold tabular-nums"
            emptyLabel="—"
          />
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            còn {getNetRatePercent(draw.gameId)}% sau thuế
          </div>
        </div>
      </div>
    </article>
  );
}

function HistoryRow({ draw }: { draw: LotteryDraw }) {
  return (
    <tr className="border-t transition hover:bg-muted/30">
      <td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatDate(draw.drawDate)}</td>
      <td className="px-4 py-3">
        <Link href={`/games/${draw.gameId}`} className="font-medium hover:underline">
          {draw.drawNo ? `#${draw.drawNo}` : draw.gameName}
        </Link>
      </td>
      <td className="px-4 py-3">
        <NumberSet draw={draw} size="sm" />
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        <PrizeText value={draw.jackpot} />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="font-medium tabular-nums">
          <PrizeText value={toNetMoney(draw.jackpot, draw.gameId)} />
        </div>
        <div className="text-xs text-muted-foreground">còn {getNetRatePercent(draw.gameId)}%</div>
      </td>
      <td className="px-4 py-3">
        <SourceBadge name={draw.sourceName} url={draw.sourceUrl} />
      </td>
    </tr>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(`${value}T00:00:00`));
}
