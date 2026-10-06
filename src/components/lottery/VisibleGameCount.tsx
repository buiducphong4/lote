"use client";

import type { LotteryGame } from "@/lib/lottery/types";
import { usePreferences } from "./PreferencesProvider";

/** Reflects how many games survive the user's hide list, not the full catalogue. */
export function VisibleGameCount({ games }: { games: LotteryGame[] }) {
  const { arrangeGames, hiddenGames } = usePreferences();
  const visible = arrangeGames(games).length;

  return (
    <>
      {visible} sản phẩm xổ số
      {hiddenGames.length ? <span className="text-muted-foreground"> · đang ẩn {hiddenGames.length}</span> : null}
    </>
  );
}
