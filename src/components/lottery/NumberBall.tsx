import { cn } from "@/lib/utils";

export type BallVariant = "main" | "bonus" | "special";

const LABELS: Record<BallVariant, string> = {
  main: "Số chính",
  bonus: "Số phụ",
  special: "Số đặc biệt"
};

const SIZE_STYLES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-10 w-10 text-sm sm:h-11 sm:w-11 sm:text-base",
  lg: "h-12 w-12 text-lg sm:h-14 sm:w-14 sm:text-xl"
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
      // Colour, border weight and radius come from the active skin via .ball-*.
      className={cn(
        "ball flex shrink-0 items-center justify-center font-bold tabular-nums",
        `ball--${variant}`,
        SIZE_STYLES[size]
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
