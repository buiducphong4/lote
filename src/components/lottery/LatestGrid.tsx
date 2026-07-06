import type { LotteryDraw } from "@/lib/lottery/types";
import { EmptyState } from "@/components/ui/empty-state";
import { DrawCard } from "./DrawCard";

export function LatestGrid({ draws }: { draws: LotteryDraw[] }) {
  if (!draws.length) {
    return <EmptyState title="Chưa có kết quả" description="Các nguồn dữ liệu hiện không trả về kết quả hợp lệ." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {draws.map((draw) => (
        <DrawCard key={draw.id} draw={draw} />
      ))}
    </div>
  );
}
