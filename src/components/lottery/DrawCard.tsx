"use client";

import { CalendarDays, Coins, Hash, Info } from "lucide-react";
import type { LotteryDraw } from "@/lib/lottery/types";
import { getNetRatePercent, getTaxNote, toNetMoney } from "@/lib/lottery/tax";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberSet } from "./NumberBall";
import { PrizeAmount, PrizeText } from "./PrizeAmount";
import { SourceBadge } from "./SourceBadge";
import { usePreferences } from "./PreferencesProvider";

export function DrawCard({ draw, featured = false }: { draw: LotteryDraw; featured?: boolean }) {
  const { format } = usePreferences();
  const netJackpot = toNetMoney(draw.jackpot, draw.gameId);
  const prizeRows = draw.prizeTable?.slice(0, featured ? 12 : 5) ?? [];

  return (
    <Card>
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{draw.region}</p>
            <CardTitle className={featured ? "text-2xl sm:text-3xl" : "text-xl"}>{draw.gameName}</CardTitle>
          </div>
          <div className="max-w-full overflow-hidden">
            <SourceBadge name={draw.sourceName} url={draw.sourceUrl} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
        <NumberSet draw={draw} size={featured ? "lg" : "md"} />

        <dl className="grid gap-2 text-sm sm:grid-cols-3">
          <Fact icon={CalendarDays} label="Ngày quay">
            {formatDate(draw.drawDate)}
          </Fact>
          <Fact icon={Hash} label="Kỳ quay">
            {draw.drawNo ? `#${draw.drawNo}` : "Không có"}
          </Fact>
          <Fact icon={Coins} label="Jackpot">
            <PrizeAmount value={draw.jackpot} />
          </Fact>
        </dl>

        {draw.jackpot2 ? (
          <div className="rounded-xl border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Jackpot 2: </span>
            <span className="font-semibold">
              <PrizeText value={draw.jackpot2} />
            </span>
          </div>
        ) : null}

        <div className="rounded-xl border border-teal-500/25 bg-teal-500/10 p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Ước tính thực nhận (còn {getNetRatePercent(draw.gameId)}%)
            </span>
            <span className="text-lg font-semibold tabular-nums">{format(netJackpot)}</span>
          </div>
          <p className="mt-1.5 flex gap-1.5 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {getTaxNote(draw.gameId)}
          </p>
        </div>

        {prizeRows.length ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Cơ cấu giải thưởng</h4>

            <div className="grid gap-2 md:hidden">
              {prizeRows.map((row) => (
                <div key={`${draw.id}-${row.tier}-mobile`} className="rounded-xl border bg-background/50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">{row.tier}</div>
                      {row.match ? <div className="mt-0.5 text-xs text-muted-foreground">{row.match}</div> : null}
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      {formatWinners(row.winners)}
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <MiniMetric label="Giá trị">
                      <PrizeText value={row.prize} />
                    </MiniMetric>
                    <MiniMetric label="Thực nhận">
                      <PrizeText value={toNetMoney(row.prize, draw.gameId)} />
                    </MiniMetric>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Hạng</th>
                    <th scope="col" className="px-3 py-2 font-medium">Khớp</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Số giải</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Giá trị</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Thực nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {prizeRows.map((row) => (
                    <tr key={`${draw.id}-${row.tier}`} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.tier}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.match ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatWinners(row.winners)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <PrizeText value={row.prize} />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        <PrizeText value={toNetMoney(row.prize, draw.gameId)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Fact({
  icon: Icon,
  label,
  children
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{children}</dd>
    </div>
  );
}

function MiniMetric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold tabular-nums">{children}</div>
    </div>
  );
}

function formatWinners(winners: number | null | undefined) {
  if (winners === null || winners === undefined) return "—";
  return `${new Intl.NumberFormat("vi-VN").format(winners)} giải`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}
