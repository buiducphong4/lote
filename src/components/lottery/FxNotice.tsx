"use client";

import { ArrowLeftRight, TriangleAlert } from "lucide-react";
import { CURRENCY_META } from "@/lib/lottery/money";
import { cn } from "@/lib/utils";
import { usePreferences } from "./PreferencesProvider";

/** Shows which exchange rate the converted prize figures are based on. */
export function FxNotice({ className }: { className?: string }) {
  const { rates } = usePreferences();
  const usdVnd = rates.rates.VND;
  const eurVnd = rates.rates.VND / rates.rates.EUR;

  const Icon = rates.stale ? TriangleAlert : ArrowLeftRight;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground",
        rates.stale && "text-amber-700 dark:text-amber-300",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        1 {CURRENCY_META.USD.symbol} = {formatVnd(usdVnd)} ₫ · 1 {CURRENCY_META.EUR.symbol} = {formatVnd(eurVnd)} ₫
      </span>
      <span className="text-[11px]">
        {rates.stale ? "Tỷ giá dự phòng (chưa kết nối được nguồn)" : `${rates.sourceName} · ${formatTime(rates.fetchedAt)}`}
      </span>
    </p>
  );
}

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
}
