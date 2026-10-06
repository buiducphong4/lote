"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import { SKIN_META } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

export function SkinPicker() {
  const { skin, setSkin } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = SKIN_META.find((item) => item.id === skin) ?? SKIN_META[0];

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Bộ giao diện: ${active.label}. Đổi bộ giao diện`}
        title={`Bộ giao diện: ${active.label}`}
      >
        <Palette className="h-4 w-4" aria-hidden="true" />
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label="Chọn bộ giao diện"
          className="glass absolute right-0 z-50 mt-2 w-64 rounded-xl p-1.5"
        >
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Bộ giao diện
          </p>

          {SKIN_META.map((item) => {
            const selected = item.id === skin;

            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setSkin(item.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "bg-muted" : "hover:bg-muted/60"
                )}
              >
                <span className="flex shrink-0 overflow-hidden rounded-md border border-border" aria-hidden="true">
                  {item.swatch.map((color) => (
                    <span key={color} className="h-7 w-3" style={{ background: color }} />
                  ))}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
                </span>

                {selected ? <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
