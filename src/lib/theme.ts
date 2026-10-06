export const SKINS = ["aurora", "ban-tin", "neon", "toi-gian"] as const;

export type SkinId = (typeof SKINS)[number];

export const DEFAULT_SKIN: SkinId = "aurora";

export const SKIN_STORAGE_KEY = "lote:skin";
export const MODE_STORAGE_KEY = "lote:theme";

export type SkinMeta = {
  id: SkinId;
  label: string;
  description: string;
  /** Three representative colours drawn as a preview chip in the picker. */
  swatch: [string, string, string];
};

export const SKIN_META: SkinMeta[] = [
  {
    id: "aurora",
    label: "Aurora",
    description: "Kính mờ, chuyển sắc, bo tròn mềm",
    swatch: ["#0f172a", "#14b8a6", "#f8fafc"]
  },
  {
    id: "ban-tin",
    label: "Bản tin",
    description: "Giấy in, chữ serif, viền mảnh",
    swatch: ["#f4ecd8", "#b23a2b", "#1c1917"]
  },
  {
    id: "neon",
    label: "Neon",
    description: "Nền tối, màu rực, hiệu ứng phát sáng",
    swatch: ["#0b0518", "#f81ce5", "#22d3ee"]
  },
  {
    id: "toi-gian",
    label: "Tối giản",
    description: "Đơn sắc, góc vuông, không đổ bóng",
    swatch: ["#ffffff", "#111111", "#9ca3af"]
  }
];

export function isSkinId(value: unknown): value is SkinId {
  return typeof value === "string" && (SKINS as readonly string[]).includes(value);
}

/**
 * Runs before first paint so the stored skin and light/dark mode are on the
 * <html> element already — without it every reload flashes the default theme.
 */
export const themeBootstrapScript = `(function(){try{
var d=document.documentElement;
var s=localStorage.getItem(${JSON.stringify(SKIN_STORAGE_KEY)});
if(s&&${JSON.stringify(SKINS)}.indexOf(s)>-1){d.setAttribute("data-skin",s);}
var m=localStorage.getItem(${JSON.stringify(MODE_STORAGE_KEY)});
var dark=m?m==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;
d.classList.toggle("dark",dark);
}catch(e){}})();`;
