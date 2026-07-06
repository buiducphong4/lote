import { AlertTriangle } from "lucide-react";

export function Warnings({ warnings }: { warnings: string[] }) {
  const unique = [...new Set(warnings)].filter(Boolean);
  if (!unique.length) return null;

  return (
    <div className="rounded-lg border border-amber-300/50 bg-amber-100/60 p-4 text-sm text-amber-950 dark:bg-amber-400/10 dark:text-amber-100">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        Cảnh báo nguồn dữ liệu
      </div>
      <ul className="space-y-1">
        {unique.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
