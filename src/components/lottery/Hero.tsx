import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="grid gap-6 py-6 sm:gap-8 sm:py-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-14">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background/45 px-3 py-2 text-xs leading-5 text-muted-foreground sm:mb-5 sm:text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-teal-500" aria-hidden="true" />
          Dashboard tra cuu du lieu, khong phai ung dung ca cuoc
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl lg:text-7xl">
          Lottery Results Dashboard
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
          Tra cuu ket qua Vietlott, Mega Millions, EuroMillions va EuroJackpot moi nhat.
        </p>
        <div className="mt-6 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/latest">
              Xem ket qua moi
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" asChild>
            <Link href="/history">Tra lich su</Link>
          </Button>
        </div>
      </div>
      <div className="glass relative overflow-hidden rounded-lg p-4 sm:p-5">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 25 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-full border border-white/40 bg-white/70 shadow-sm dark:bg-white/10"
            />
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-5">
          <p className="text-sm font-medium">6 san pham, mot schema du lieu thong nhat</p>
        </div>
      </div>
    </section>
  );
}
