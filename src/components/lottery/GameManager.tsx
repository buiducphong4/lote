"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, RotateCcw, SlidersHorizontal } from "lucide-react";
import { orderGames } from "@/lib/lottery/games";
import type { LotteryGame, LotteryGameId } from "@/lib/lottery/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameBadge } from "./GameBadge";
import { usePreferences } from "./PreferencesProvider";

export function GameManager({ games }: { games: LotteryGame[] }) {
  const { gameOrder, setGameOrder, hiddenGames, isHidden, toggleHidden, resetGames } = usePreferences();
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<LotteryGameId | null>(null);

  const ordered = orderGames(games, gameOrder);
  const visibleCount = ordered.length - hiddenGames.length;
  const customised = hiddenGames.length > 0 || Boolean(gameOrder);

  function reorder(fromId: LotteryGameId, toIndex: number) {
    const ids = ordered.map((game) => game.id);
    const from = ids.indexOf(fromId);
    if (from < 0 || toIndex < 0 || toIndex >= ids.length) return;

    ids.splice(toIndex, 0, ...ids.splice(from, 1));
    setGameOrder(ids);
  }

  return (
    <div className="rounded-xl border border-border/70 bg-background/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        Sắp xếp &amp; ẩn xổ số
        <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">
          {open ? "Đóng" : `Hiện ${visibleCount}/${ordered.length}`}
        </span>
      </button>

      {open ? (
        <div className="border-t border-border/70 p-3">
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            Kéo thẻ hoặc dùng mũi tên để đổi thứ tự, bấm biểu tượng con mắt để ẩn loại không cần. Lựa chọn được lưu
            trên máy của bạn.
          </p>

          <ul className="grid gap-2">
            {ordered.map((game, index) => {
              const hidden = isHidden(game.id);
              const lastVisible = !hidden && visibleCount <= 1;

              return (
                <li
                  key={game.id}
                  draggable
                  onDragStart={() => setDragId(game.id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragId && dragId !== game.id) reorder(dragId, index);
                    setDragId(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border bg-background/70 p-2 transition",
                    dragId === game.id && "opacity-50",
                    hidden && "opacity-55"
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />
                  <GameBadge game={game} size="md" />

                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm font-medium", hidden && "line-through")}>
                      {game.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {hidden ? "Đang ẩn" : game.regionLabel}
                    </span>
                  </span>

                  <span className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => reorder(game.id, index - 1)}
                      disabled={index === 0}
                      aria-label={`Đưa ${game.name} lên trên`}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => reorder(game.id, index + 1)}
                      disabled={index === ordered.length - 1}
                      aria-label={`Đưa ${game.name} xuống dưới`}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleHidden(game.id)}
                      disabled={lastVisible}
                      aria-pressed={hidden}
                      title={lastVisible ? "Phải giữ lại ít nhất một loại xổ số" : undefined}
                      aria-label={hidden ? `Hiện lại ${game.name}` : `Ẩn ${game.name}`}
                    >
                      {hidden ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>

          {customised ? (
            <Button variant="outline" className="mt-3 w-full sm:w-auto" onClick={resetGames}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Về mặc định
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
