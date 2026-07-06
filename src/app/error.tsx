"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="glass rounded-lg p-8">
      <div className="flex items-start gap-4">
        <AlertTriangle className="mt-1 h-6 w-6 text-amber-500" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-semibold">Không tải được dashboard</h1>
          <p className="mt-2 text-muted-foreground">{error.message || "Đã có lỗi ngoài dự kiến."}</p>
          <Button className="mt-5" onClick={reset}>
            Thử lại
          </Button>
        </div>
      </div>
    </section>
  );
}
