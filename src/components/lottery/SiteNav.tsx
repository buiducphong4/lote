"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Tổng quan", icon: Home },
  { href: "/latest", label: "Mới nhất", icon: Sparkles },
  { href: "/history", label: "Lịch sử", icon: History }
];

export function SiteNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("grid grid-cols-3 gap-1 sm:flex sm:items-center", className)} aria-label="Điều hướng chính">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium leading-none transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
