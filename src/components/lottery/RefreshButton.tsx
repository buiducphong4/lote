"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();

  return (
    <Button className="w-full sm:w-auto" variant="outline" onClick={() => router.refresh()}>
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      Làm mới
    </Button>
  );
}
