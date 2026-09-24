import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import "@/styles/globals.css";
import { CurrencySwitcher } from "@/components/lottery/CurrencySwitcher";
import { PreferencesProvider } from "@/components/lottery/PreferencesProvider";
import { SiteNav } from "@/components/lottery/SiteNav";
import { ThemeToggle } from "@/components/lottery/ThemeToggle";
import { games } from "@/lib/lottery/games";
import { getFxRates } from "@/lib/lottery/fx";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Lote · Kết quả xổ số",
  description: "Tra cứu kết quả Vietlott, Mega Millions, EuroMillions và EuroJackpot mới nhất, quy đổi sang VND."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rates = await getFxRates();
  const defaultOrder = games.map((game) => game.id);

  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <PreferencesProvider rates={rates} defaultOrder={defaultOrder}>
          <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
            <header className="glass sticky top-2 z-50 mb-5 rounded-xl p-2 sm:top-4 sm:mb-8 sm:px-3 sm:py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Lote · trang chủ"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold">Lote</span>
                </Link>

                <SiteNav className="order-3 w-full sm:order-none sm:ml-auto sm:w-auto" />

                <div className="ml-auto flex items-center gap-2 sm:ml-0">
                  <CurrencySwitcher className="hidden sm:inline-flex" />
                  <ThemeToggle />
                </div>
              </div>

              <CurrencySwitcher className="mt-2 flex w-full justify-center sm:hidden" />
            </header>

            <main className="flex-1">{children}</main>

            <footer className="mt-10 rounded-xl border border-border/70 p-4 text-xs leading-6 text-muted-foreground sm:mt-12">
              Thông tin chỉ dùng để tham khảo, vui lòng đối chiếu với nguồn chính thức trước khi nhận thưởng. Tỷ giá quy
              đổi mang tính tham khảo. Không khuyến khích cờ bạc.
            </footer>
          </div>
        </PreferencesProvider>
      </body>
    </html>
  );
}
