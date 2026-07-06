import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { BarChart3, History, Home, Sparkles } from "lucide-react";
import "@/styles/globals.css";
import { ThemeToggle } from "@/components/lottery/ThemeToggle";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Lottery Results Dashboard",
  description: "Tra cứu kết quả Vietlott, Mega Millions và EuroMillions mới nhất."
};

const navItems = [
  { href: "/", label: "Tổng quan", icon: Home },
  { href: "/latest", label: "Mới nhất", icon: Sparkles },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/statistics", label: "Thống kê", icon: BarChart3 }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-5 lg:px-8">
          <header className="glass sticky top-2 z-50 mb-5 flex flex-wrap items-center gap-2 rounded-lg p-2 sm:top-4 sm:mb-8 sm:flex-nowrap sm:px-3 sm:py-3">
            <Link href="/" className="flex items-center gap-3" aria-label="Lottery Dashboard home">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background sm:h-10 sm:w-10">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold">Lote</span>
            </Link>
            <nav className="order-3 grid w-full grid-cols-4 gap-1 sm:order-none sm:ml-auto sm:w-auto sm:flex sm:items-center" aria-label="Điều hướng chính">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium leading-none text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:min-h-0 sm:flex-row sm:px-3 sm:text-sm"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto sm:ml-0">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-10 rounded-lg border border-border/70 p-4 text-xs leading-6 text-muted-foreground sm:mt-12 sm:text-sm">
            Thông tin chỉ dùng để tham khảo, vui lòng đối chiếu với nguồn chính thức trước khi nhận thưởng.
            Không khuyến khích cờ bạc.
          </footer>
        </div>
      </body>
    </html>
  );
}
