"use client";

import Link from "next/link";
import { orderGames } from "@/lib/lottery/games";
import type { LotteryGame, LotteryGameId } from "@/lib/lottery/types";
import { cn } from "@/lib/utils";
import { usePreferences } from "./PreferencesProvider";

export function GameTabs({
  games,
  activeGameId,
  basePath,
  extraParams
}: {
  games: LotteryGame[];
  activeGameId?: LotteryGameId;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const { gameOrder } = usePreferences();

  return (
    <div
      className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Chọn sản phẩm xổ số"
    >
      {orderGames(games, gameOrder).map((game) => {
        const active = activeGameId === game.id;

        return (
          <Link
            key={game.id}
            href={buildHref(basePath, game.id, extraParams)}
            role="tab"
            aria-selected={active}
            className={cn(
              "flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background/50 text-muted-foreground hover:border-foreground/25 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br text-[9px] font-bold text-white",
                game.accent
              )}
              aria-hidden="true"
            >
              {game.iconHint}
            </span>
            <span className="whitespace-nowrap">{game.shortName}</span>
          </Link>
        );
      })}
    </div>
  );
}

function buildHref(basePath: string, gameId: LotteryGameId, extraParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams({ gameId });
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    if (value) params.set(key, value);
  }
  return `${basePath}?${params.toString()}`;
}
