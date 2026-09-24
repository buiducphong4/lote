"use client";

import { formatMoney, type Money } from "@/lib/lottery/money";
import { cn } from "@/lib/utils";
import { usePreferences } from "./PreferencesProvider";

/**
 * Renders a prize in the preferred currency and, for foreign games, adds the
 * live VND conversion underneath.
 */
export function PrizeAmount({
  value,
  className,
  showVnd = true,
  emptyLabel = "Chưa công bố"
}: {
  value: Money | null | undefined;
  className?: string;
  showVnd?: boolean;
  emptyLabel?: string;
}) {
  const { format, toVnd, currency } = usePreferences();

  if (!value) {
    return <span className={cn("text-muted-foreground", className)}>{emptyLabel}</span>;
  }

  // Only worth showing when the headline figure is not already in VND.
  const vnd = currency === "VND" ? null : toVnd(value);

  return (
    <span className={cn("block", className)}>
      <span className="block truncate">{format(value)}</span>
      {showVnd && vnd ? (
        <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground" title="Quy đổi theo tỷ giá hiện tại">
          ≈ {formatMoney(vnd)}
        </span>
      ) : null}
    </span>
  );
}

/** Inline single-line variant for dense table cells. */
export function PrizeText({ value, emptyLabel = "—" }: { value: Money | null | undefined; emptyLabel?: string }) {
  const { format } = usePreferences();
  return <>{value ? format(value) : emptyLabel}</>;
}
