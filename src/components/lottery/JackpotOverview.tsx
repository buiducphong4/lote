"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { orderGames } from "@/lib/lottery/games";
import { toNetMoney } from "@/lib/lottery/tax";
import type { LotteryDraw, LotteryGame } from "@/lib/lottery/types";
import { cn } from "@/lib/utils";
import { NumberSet } from "./NumberBall";
import { PrizeAmount } from "./PrizeAmount";
import { usePreferences } from "./PreferencesProvider";

export function JackpotOverview({ games, draws }: { games: LotteryGame[]; draws: LotteryDraw[] }) {
  const { gameOrder } = usePreferences();
  const drawsByGame = new Map(draws.map((draw) => [draw.gameId, draw]));

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {orderGames(games, gameOrder).map((game) => (
        <OverviewCard key={game.id} game={game} draw={drawsByGame.get(game.id)} />
      ))}
    </div>
  );
}

function OverviewCard({ game, draw }: { game: LotteryGame; draw?: LotteryDraw }) {
  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex flex-col rounded-xl border bg-background/60 p-3 transition hover:border-foreground/25 hover:bg-background/90 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${game.accent} text-xs font-bold text-white`}
          aria-hidden="true"
        >
          {game.iconHint}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold leading-5">{game.name}</h2>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  {draw
                    ? `${formatShortDate(draw.drawDate)}${draw.drawNo ? ` · #${draw.drawNo}` : ""}`
                    : game.regionLabel}
                </span>
              </p>
            </div>
            <ArrowRight
              className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {draw ? (
        <>
          <NumberSet draw={draw} size="sm" className="mt-3" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric label="Jackpot" value={draw.jackpot} />
            <Metric label="Thực nhận" value={toNetMoney(draw.jackpot, draw.gameId)} emphasis />
          </div>
        </>
      ) : (
        <p className="mt-3 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
          Nguồn dữ liệu chưa trả về kết quả mới nhất.
        </p>
      )}
    </Link>
  );
}

function Metric({
  label,
  value,
  emphasis = false
}: {
  label: string;
  value: Parameters<typeof PrizeAmount>[0]["value"];
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <PrizeAmount
        value={value}
        className={cn("text-xs font-semibold leading-5 tabular-nums", emphasis && "text-teal-700 dark:text-teal-300")}
      />
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00`));
}
