"use client";

import { CalendarClock } from "lucide-react";
import { formatVnLong } from "@/lib/lottery/drawTime";
import type { NextDraw } from "@/lib/lottery/types";
import { cn } from "@/lib/utils";
import { PrizeAmount } from "./PrizeAmount";

/**
 * Lottery sites headline the jackpot of the draw that has not happened yet, so show it beside the
 * completed draw's prize. Without it the two figures look like one of them is wrong.
 */
export function NextDrawPanel({ next, className }: { next: NextDraw; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-background/60 p-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Jackpot kỳ tới ·{" "}
          {next.drawAt ? `${formatVnLong(next.drawAt)} (giờ VN)` : formatDate(next.drawDate)}
          {next.drawNo ? <span className="text-xs">#{next.drawNo}</span> : null}
        </span>
        <PrizeAmount value={next.jackpot} className="text-lg font-semibold tabular-nums" />
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Mức nhà điều hành công bố cho kỳ chưa quay (nguồn {next.sourceName}) — đây là con số các trang xổ số
        hiển thị, khác với giá trị cộng dồn của kỳ vừa quay ở trên.
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}
