import Link from "next/link";
import { ArrowRight, History, ShieldCheck } from "lucide-react";
import { FxNotice } from "@/components/lottery/FxNotice";
import { GameOrderEditor } from "@/components/lottery/GameOrderEditor";
import { JackpotOverview } from "@/components/lottery/JackpotOverview";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { Button } from "@/components/ui/button";
import { getGames, getLatest } from "@/lib/lottery/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [games, latest] = await Promise.all([getGames(), getLatest()]);

  return (
    <div className="space-y-5">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-lg border bg-background/55 px-2.5 py-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-500" aria-hidden="true" />
              Dashboard tra cứu, không phải ứng dụng cá cược
            </p>
            <h1 className="text-2xl font-semibold leading-tight sm:text-4xl">Jackpot hiện tại</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Kết quả mới nhất, jackpot và ước tính thực nhận của {games.length} sản phẩm xổ số.
            </p>
            <FxNotice className="mt-2" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center">
            <Button variant="outline" asChild>
              <Link href="/history">
                <History className="h-4 w-4" aria-hidden="true" />
                Lịch sử
              </Link>
            </Button>
            <RefreshButton />
          </div>
        </div>

        <Warnings warnings={latest.warnings} />
        <GameOrderEditor games={games} />
        <JackpotOverview games={games} draws={latest.draws} />
      </section>

      <section className="glass rounded-xl p-3 text-sm text-muted-foreground sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>Dữ liệu chỉ mang tính tham khảo. Hãy đối chiếu với nguồn chính thức trước khi nhận thưởng.</p>
          <Button className="w-full shrink-0 sm:w-auto" variant="outline" asChild>
            <Link href="/latest">
              Xem chi tiết mới nhất
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
