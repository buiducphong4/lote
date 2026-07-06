import Link from "next/link";
import type { LotteryGame, LotteryGameId } from "@/lib/lottery/types";
import { cn } from "@/lib/utils";

export function GameTabs({
  games,
  activeGameId,
  basePath
}: {
  games: LotteryGame[];
  activeGameId?: LotteryGameId;
  basePath: string;
}) {
  return (
    <div
      className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Chon san pham xo so"
    >
      {games.map((game) => (
        <Link
          key={game.id}
          href={`${basePath}?gameId=${game.id}`}
          role="tab"
          aria-selected={activeGameId === game.id}
          className={cn(
            "min-h-11 min-w-[8.75rem] shrink-0 snap-start rounded-lg border px-4 py-3 text-center text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring sm:min-w-0 sm:py-2",
            activeGameId === game.id
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background/45 text-muted-foreground hover:text-foreground"
          )}
        >
          {game.shortName}
        </Link>
      ))}
    </div>
  );
}
