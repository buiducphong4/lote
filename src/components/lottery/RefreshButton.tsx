"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [purging, setPurging] = useState(false);
  const busy = purging || isPending;

  async function handleRefresh() {
    setPurging(true);
    try {
      // Without this the server just replays its memoised payload and nothing appears to change.
      await fetch("/api/lottery/refresh", { method: "POST" });
    } catch {
      // A failed purge still deserves a re-render.
    }
    setPurging(false);
    startTransition(() => router.refresh());
  }

  return (
    <Button className="w-full sm:w-auto" variant="outline" disabled={busy} onClick={handleRefresh}>
      <RefreshCw className={cn("h-4 w-4", busy && "animate-spin")} aria-hidden="true" />
      {busy ? "Đang tải" : "Làm mới"}
    </Button>
  );
}
