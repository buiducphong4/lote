"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { LotteryGame, LotteryGameId } from "@/lib/lottery/types";
import { orderGames } from "@/lib/lottery/games";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePreferences } from "./PreferencesProvider";

export function GameOrderEditor({ games }: { games: LotteryGame[] }) {
  const { gameOrder, setGameOrder, resetGameOrder } = usePreferences();
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<LotteryGameId | null>(null);

  const ordered = orderGames(games, gameOrder);

  function move(id: LotteryGameId, offset: number) {
    const ids = ordered.map((game) => game.id);
    const from = ids.indexOf(id);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= ids.length) return;

    ids.splice(to, 0, ...ids.splice(from, 1));
    setGameOrder(ids);
  }

  function dropOn(targetId: LotteryGameId) {
    if (!dragId || dragId === targetId) return;

    const ids = ordered.map((game) => game.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    ids.splice(to, 0, ...ids.splice(from, 1));
    setGameOrder(ids);
    setDragId(null);
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
        Sắp xếp thứ tự xổ số
        <span className="ml-auto text-xs font-normal text-muted-foreground">{open ? "Đóng" : "Tùy chỉnh"}</span>
      </button>

      {open ? (
        <div className="border-t border-border/70 p-3">
          <p className="mb-3 text-xs text-muted-foreground">
            Kéo thẻ hoặc dùng mũi tên để đổi thứ tự. Thứ tự này được lưu trên máy của bạn.
          </p>

          <ul className="grid gap-2">
            {ordered.map((game, index) => (
              <li
                key={game.id}
                draggable
                onDragStart={() => setDragId(game.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => dropOn(game.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border bg-background/70 p-2 transition",
                  dragId === game.id && "opacity-50"
                )}
              >
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${game.accent} text-[10px] font-bold text-white`}
                  aria-hidden="true"
                >
                  {game.iconHint}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{game.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{game.regionLabel}</span>
                </span>
                <span className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => move(game.id, -1)}
                    disabled={index === 0}
                    aria-label={`Đưa ${game.name} lên trên`}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => move(game.id, 1)}
                    disabled={index === ordered.length - 1}
                    aria-label={`Đưa ${game.name} xuống dưới`}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </span>
              </li>
            ))}
          </ul>

          <Button variant="outline" className="mt-3 w-full sm:w-auto" onClick={resetGameOrder}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Về thứ tự mặc định
          </Button>
        </div>
      ) : null}
    </div>
  );
}
