import type { MetadataRoute } from "next";

/**
 * Served at /manifest.webmanifest. Without it Chromium browsers (Brave, Chrome, Edge) have no
 * app identity to install, so the "Install" entry never appears.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lote · Kết quả xổ số",
    short_name: "Lote",
    description:
      "Tra cứu kết quả Vietlott, Mega Millions, EuroMillions và EuroJackpot mới nhất, quy đổi sang VND.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "vi",
    dir: "ltr",
    categories: ["utilities", "news"],
    // Matches the dark surface the app paints before hydration, so the splash does not flash white.
    background_color: "#07111f",
    theme_color: "#07111f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Kết quả mới nhất", url: "/latest" },
      { name: "Lịch sử", url: "/history" }
    ]
  };
}
