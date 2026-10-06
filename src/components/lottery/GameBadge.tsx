import type { LotteryGame } from "@/lib/lottery/types";
import { cn } from "@/lib/utils";

const SIZE_STYLES = {
  sm: "h-6 w-6 rounded text-[9px]",
  md: "h-8 w-8 rounded-md text-[10px]",
  lg: "h-10 w-10 rounded-lg text-xs",
  xl: "h-12 w-12 rounded-xl text-sm"
} as const;

/**
 * The square game marker. Each game brings its own gradient; flat skins switch
 * the gradient off through the `--badge-opacity` token in globals.css.
 */
export function GameBadge({
  game,
  size = "md",
  className
}: {
  game: Pick<LotteryGame, "accent" | "iconHint">;
  size?: keyof typeof SIZE_STYLES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "game-badge flex shrink-0 items-center justify-center bg-gradient-to-br font-bold",
        game.accent,
        SIZE_STYLES[size],
        className
      )}
      aria-hidden="true"
    >
      {game.iconHint}
    </span>
  );
}
