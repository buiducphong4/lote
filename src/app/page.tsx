import Link from "next/link";
import { ArrowRight, History, ShieldCheck } from "lucide-react";
import { JackpotOverview } from "@/components/lottery/JackpotOverview";
import { RefreshButton } from "@/components/lottery/RefreshButton";
import { Warnings } from "@/components/lottery/Warnings";
import { Button } from "@/components/ui/button";
import { getGames, getLatest } from "@/lib/lottery/service";

export default async function HomePage() {
  const [games, latest] = await Promise.all([getGames(), getLatest()]);

  return (
    <div className="space-y-4">
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg border bg-background/55 px-2.5 py-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-500" aria-hidden="true" />
              Tong quan jackpot moi nhat
            </div>
            <h1 className="text-2xl font-semibold leading-tight sm:text-4xl">Jackpot hien tai</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ket qua moi nhat, jackpot va uoc tinh thuc nhan cua {games.length} giai.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <Button variant="outline" asChild>
              <Link href="/history">
                <History className="h-4 w-4" aria-hidden="true" />
                Lich su
              </Link>
            </Button>
            <RefreshButton />
          </div>
        </div>

        <Warnings warnings={latest.warnings} />
        <JackpotOverview games={games} draws={latest.draws} />
      </section>

      <section className="glass rounded-lg p-3 text-sm text-muted-foreground sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Thong ke chi mang tinh tham khao. Hay doi chieu voi nguon chinh thuc truoc khi nhan thuong.
          </p>
          <Button className="w-full sm:w-auto" variant="outline" asChild>
            <Link href="/latest">
              Xem chi tiet moi nhat
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
