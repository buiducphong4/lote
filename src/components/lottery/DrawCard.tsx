import { CalendarDays, Coins, Hash } from "lucide-react";
import type { LotteryDraw } from "@/lib/lottery/types";
import { formatNetPrize, getNetRate } from "@/lib/lottery/tax";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberBall } from "./NumberBall";
import { SourceBadge } from "./SourceBadge";

export function DrawCard({ draw, featured = false }: { draw: LotteryDraw; featured?: boolean }) {
  return (
    <Card className={featured ? "p-1" : ""}>
      <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{draw.region}</p>
            <CardTitle className={featured ? "text-2xl sm:text-3xl" : "text-xl"}>{draw.gameName}</CardTitle>
          </div>
          <div className="max-w-full overflow-hidden">
            <SourceBadge name={draw.sourceName} url={draw.sourceUrl} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 pt-3 sm:p-5 sm:pt-3">
        <div className="flex flex-wrap gap-2">
          {draw.mainNumbers.map((number, index) => (
            <NumberBall key={`${draw.id}-main-${index}-${number}`} value={number} />
          ))}
          {draw.specialNumbers?.map((number, index) => (
            <NumberBall key={`${draw.id}-special-${index}-${number}`} value={number} variant="special" />
          ))}
          {draw.bonusNumbers?.map((number, index) => (
            <NumberBall key={`${draw.id}-bonus-${index}-${number}`} value={number} variant="bonus" />
          ))}
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-muted/55 p-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Ngày quay
            </dt>
            <dd className="mt-1 font-semibold">{formatDate(draw.drawDate)}</dd>
          </div>
          <div className="rounded-lg bg-muted/55 p-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" aria-hidden="true" />
              Kỳ quay
            </dt>
            <dd className="mt-1 font-semibold">{draw.drawNo ? `#${draw.drawNo}` : "Không có"}</dd>
          </div>
          <div className="rounded-lg bg-muted/55 p-3">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Coins className="h-4 w-4" aria-hidden="true" />
              Jackpot
            </dt>
            <dd className="mt-1 font-semibold">{draw.jackpot ?? "Chưa công bố"}</dd>
          </div>
        </dl>

        <div className="rounded-lg border border-teal-500/25 bg-teal-500/10 p-3 text-sm">
          <span className="text-muted-foreground">Ước tính thực nhận sau thuế ({Math.round(getNetRate(draw.gameId) * 100)}%): </span>
          <span className="font-semibold">{formatNetPrize(draw.jackpot, draw)}</span>
        </div>

        {draw.prizeTable?.length ? (
          <>
            <div className="grid gap-2 md:hidden">
              {draw.prizeTable.slice(0, featured ? 12 : 5).map((row) => (
                <div key={`${draw.id}-${row.tier}-mobile`} className="rounded-lg border bg-background/45 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{row.tier}</div>
                      {row.match ? <div className="mt-1 text-xs text-muted-foreground">{row.match}</div> : null}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {row.winners ?? ""} giải
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">Giá trị</div>
                      <div className="mt-1 font-semibold">{row.prize ?? ""}</div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <div className="text-xs text-muted-foreground">Thực nhận</div>
                      <div className="mt-1 font-semibold">{formatNetPrize(row.prize, draw)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-hidden rounded-lg border md:block">
              <table className="w-full text-sm">
              <thead className="bg-muted/70 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Hạng</th>
                  <th className="px-3 py-2 font-medium">Khớp</th>
                  <th className="px-3 py-2 text-right font-medium">Số giải</th>
                  <th className="px-3 py-2 text-right font-medium">Giá trị</th>
                  <th className="px-3 py-2 text-right font-medium">Thực nhận</th>
                </tr>
              </thead>
              <tbody>
                {draw.prizeTable.slice(0, featured ? 12 : 5).map((row) => (
                  <tr key={`${draw.id}-${row.tier}`} className="border-t">
                    <td className="px-3 py-2">{row.tier}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.match ?? ""}</td>
                    <td className="px-3 py-2 text-right">{row.winners ?? ""}</td>
                    <td className="px-3 py-2 text-right">{row.prize ?? ""}</td>
                    <td className="px-3 py-2 text-right">{formatNetPrize(row.prize, draw)}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}
