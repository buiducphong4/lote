import type { Metadata } from "next";
import { Be_Vietnam_Pro, Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import "@/styles/globals.css";
import { CurrencySwitcher } from "@/components/lottery/CurrencySwitcher";
import { PreferencesProvider } from "@/components/lottery/PreferencesProvider";
import { SiteNav } from "@/components/lottery/SiteNav";
import { SkinPicker } from "@/components/lottery/SkinPicker";
import { ThemeProvider } from "@/components/lottery/ThemeProvider";
import { ThemeToggle } from "@/components/lottery/ThemeToggle";
import { games } from "@/lib/lottery/games";
import { getFxRates } from "@/lib/lottery/fx";
import { DEFAULT_SKIN, themeBootstrapScript } from "@/lib/theme";

// Each skin picks its display and body faces from these CSS variables.
const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter", display: "swap" });
const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap"
});
const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap"
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jetbrains",
  display: "swap"
});

const fontVariables = `${inter.variable} ${beVietnam.variable} ${playfair.variable} ${jetbrains.variable}`;

export const metadata: Metadata = {
  title: "Lote · Kết quả xổ số",
  description: "Tra cứu kết quả Vietlott, Mega Millions, EuroMillions và EuroJackpot mới nhất, quy đổi sang VND."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rates = await getFxRates();
  const defaultOrder = games.map((game) => game.id);

  return (
    <html lang="vi" data-skin={DEFAULT_SKIN} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Applies the saved skin and light/dark mode before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
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
                    <span className="font-display text-sm font-semibold">Lote</span>
                  </Link>

                  <SiteNav className="order-3 w-full sm:order-none sm:ml-auto sm:w-auto" />

                  <div className="ml-auto flex items-center gap-1 sm:ml-0">
                    <CurrencySwitcher className="mr-1 hidden sm:inline-flex" />
                    <SkinPicker />
                    <ThemeToggle />
                  </div>
                </div>

                <CurrencySwitcher className="mt-2 flex w-full justify-center sm:hidden" />
              </header>

              <main className="flex-1">{children}</main>

              <footer className="mt-10 rounded-xl border border-border/70 p-4 text-xs leading-6 text-muted-foreground sm:mt-12">
                Thông tin chỉ dùng để tham khảo, vui lòng đối chiếu với nguồn chính thức trước khi nhận thưởng. Tỷ giá
                quy đổi mang tính tham khảo. Không khuyến khích cờ bạc.
              </footer>
            </div>
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
