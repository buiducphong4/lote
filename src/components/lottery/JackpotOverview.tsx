import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import type { LotteryDraw, LotteryGame } from "@/lib/lottery/types";
import { formatNetPrize } from "@/lib/lottery/tax";
import { cn } from "@/lib/utils";

export function JackpotOverview({
  games,
  draws
}: {
  games: LotteryGame[];
  draws: LotteryDraw[];
}) {
  const drawsByGame = new Map(draws.map((draw) => [draw.gameId, draw]));

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {games.map((game) => (
        <OverviewItem key={game.id} game={game} draw={drawsByGame.get(game.id)} />
      ))}
    </div>
  );
}

function OverviewItem({ game, draw }: { game: LotteryGame; draw?: LotteryDraw }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group rounded-lg border bg-background/55 p-3 transition hover:bg-background/80 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${game.accent} text-xs font-bold text-white`}>
          {game.iconHint}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold leading-5">{game.name}</h2>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {draw ? `${formatShortDate(draw.drawDate)}${draw.drawNo ? ` · #${draw.drawNo}` : ""}` : "Chua co ket qua"}
                </span>
              </div>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
          </div>

          {draw ? (
            <>
              <div className="mt-2 flex flex-wrap gap-1">
                {draw.mainNumbers.map((number, index) => (
                  <SmallBall key={`${draw.id}-overview-main-${index}`} value={number} />
                ))}
                {draw.specialNumbers?.map((number, index) => (
                  <SmallBall key={`${draw.id}-overview-special-${index}`} value={number} variant="special" />
                ))}
                {draw.bonusNumbers?.map((number, index) => (
                  <SmallBall key={`${draw.id}-overview-bonus-${index}`} value={number} variant="bonus" />
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <PrizeMetric label="Jackpot" value={draw.jackpot ?? "Chua cong bo"} />
                <PrizeMetric label="Thuc nhan" value={formatNetPrize(draw.jackpot, draw)} emphasis />
              </div>
            </>
          ) : (
            <div className="mt-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
              Nguon du lieu chua tra ve ket qua moi nhat.
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function SmallBall({
  value,
  variant = "main"
}: {
  value: number;
  variant?: "main" | "bonus" | "special";
}) {
  return (
    <span
      className={cn(
        "flex h-7 min-w-7 items-center justify-center rounded-full border px-1 text-[11px] font-bold leading-none",
        variant === "main" && "border-slate-300 bg-slate-50 text-slate-950",
        variant === "bonus" && "border-amber-500 bg-amber-100 text-amber-950",
        variant === "special" && "border-teal-500 bg-teal-100 text-teal-950"
      )}
    >
      {String(value).padStart(2, "0")}
    </span>
  );
}

function PrizeMetric({
  label,
  value,
  emphasis = false
}: {
  label: string;
  value: string | number;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("truncate text-xs font-semibold leading-5", emphasis && "text-teal-700 dark:text-teal-300")}>
        {value}
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`));
}
