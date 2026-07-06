import { cn } from "@/lib/utils";

export function NumberBall({
  value,
  variant = "main"
}: {
  value: number;
  variant?: "main" | "bonus" | "special";
}) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold shadow-[0_8px_22px_rgba(15,23,42,0.14)] transition sm:h-12 sm:w-12",
        variant === "main" &&
          "border-slate-300 bg-slate-50 text-slate-950 dark:border-slate-500 dark:bg-slate-100 dark:text-slate-950",
        variant === "bonus" &&
          "border-amber-500 bg-amber-100 text-amber-950 dark:border-amber-300 dark:bg-amber-200 dark:text-amber-950",
        variant === "special" &&
          "border-teal-500 bg-teal-100 text-teal-950 dark:border-teal-300 dark:bg-teal-200 dark:text-teal-950"
      )}
      aria-label={`${variant === "main" ? "Số chính" : variant === "bonus" ? "Số phụ" : "Số đặc biệt"} ${value}`}
    >
      {String(value).padStart(2, "0")}
    </span>
  );
}
