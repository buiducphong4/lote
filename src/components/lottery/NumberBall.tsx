import { cn } from "@/lib/utils";

export type BallVariant = "main" | "bonus" | "special";

const LABELS: Record<BallVariant, string> = {
  main: "Số chính",
  bonus: "Số phụ",
  special: "Số đặc biệt"
};

const VARIANT_STYLES: Record<BallVariant, string> = {
  main: "border-slate-300 bg-white text-slate-900 dark:border-slate-400/70 dark:bg-slate-100 dark:text-slate-900",
  bonus: "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-300 dark:bg-amber-200 dark:text-amber-900",
  special: "border-teal-400 bg-teal-100 text-teal-900 dark:border-teal-300 dark:bg-teal-200 dark:text-teal-900"
};

const SIZE_STYLES = {
  sm: "h-7 w-7 border text-[11px]",
  md: "h-10 w-10 border-2 text-sm sm:h-11 sm:w-11 sm:text-base",
  lg: "h-12 w-12 border-2 text-lg sm:h-14 sm:w-14 sm:text-xl"
} as const;

export function NumberBall({
  value,
  variant = "main",
  size = "md"
}: {
  value: number;
  variant?: BallVariant;
  size?: keyof typeof SIZE_STYLES;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums shadow-sm",
        SIZE_STYLES[size],
        VARIANT_STYLES[variant]
      )}
      aria-label={`${LABELS[variant]} ${value}`}
    >
      {String(value).padStart(2, "0")}
    </span>
  );
}

/** Renders a draw's full number set in a consistent main → special → bonus order. */
export function NumberSet({
  draw,
  size = "md",
  className
}: {
  draw: { id: string; mainNumbers: number[]; bonusNumbers?: number[]; specialNumbers?: number[] };
  size?: keyof typeof SIZE_STYLES;
  className?: string;
}) {
  const groups: { variant: BallVariant; numbers: number[] }[] = [
    { variant: "main", numbers: draw.mainNumbers },
    { variant: "special", numbers: draw.specialNumbers ?? [] },
    { variant: "bonus", numbers: draw.bonusNumbers ?? [] }
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 sm:gap-2", className)}>
      {groups.map(({ variant, numbers }) =>
        numbers.map((number, index) => (
          <NumberBall key={`${draw.id}-${variant}-${index}`} value={number} variant={variant} size={size} />
        ))
      )}
    </div>
  );
}
