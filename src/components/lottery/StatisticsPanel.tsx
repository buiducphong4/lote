import type { LotteryDraw } from "@/lib/lottery/types";
import { computeNumberStats } from "@/lib/lottery/normalize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatisticsPanel({ draws }: { draws: LotteryDraw[] }) {
  const stats = computeNumberStats(draws);
  const hot = stats.slice(0, 8);
  const cold = [...stats].sort((a, b) => a.count - b.count || a.number - b.number).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê mô tả</CardTitle>
        <p className="text-sm text-muted-foreground">Tần suất chỉ mô tả lịch sử đã tải, không phải dự đoán.</p>
      </CardHeader>
      <CardContent className="grid gap-5 p-4 pt-3 sm:p-5 sm:pt-3 lg:grid-cols-2">
        <StatList title="Hot numbers" items={hot} />
        <StatList title="Cold numbers" items={cold} />
      </CardContent>
    </Card>
  );
}

function StatList({
  title,
  items
}: {
  title: string;
  items: { number: number; count: number; lastAppeared: string | null }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{title}</h4>
      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.number} className="grid gap-1 rounded-lg bg-muted/55 p-3 text-sm sm:flex sm:items-center sm:justify-between">
            <span className="font-semibold">{String(item.number).padStart(2, "0")}</span>
            <span className="text-muted-foreground sm:text-right">
              {item.count} lần · gần nhất {item.lastAppeared ?? "n/a"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
