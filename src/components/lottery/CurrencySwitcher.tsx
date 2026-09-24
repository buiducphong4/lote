"use client";

import { Coins } from "lucide-react";
import { CURRENCIES, CURRENCY_META, type CurrencyPreference } from "@/lib/lottery/money";
import { cn } from "@/lib/utils";
import { usePreferences } from "./PreferencesProvider";

const options: { value: CurrencyPreference; label: string; title: string }[] = [
  { value: "native", label: "Gốc", title: "Giữ nguyên tiền tệ của từng giải" },
  ...CURRENCIES.map((code) => ({
    value: code as CurrencyPreference,
    label: code,
    title: `Quy đổi tất cả sang ${CURRENCY_META[code].label}`
  }))
];

export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, setCurrency } = usePreferences();

  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-lg border border-border bg-background/60 p-1", className)}
      role="radiogroup"
      aria-label="Đơn vị tiền tệ hiển thị"
    >
      <Coins className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={currency === option.value}
          title={option.title}
          onClick={() => setCurrency(option.value)}
          className={cn(
            "min-h-8 rounded-md px-2 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            currency === option.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
