import { AlertTriangle } from "lucide-react";

export function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100"
    >
      <div className="flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          {warnings.map((warning) => (
            <p key={warning} className="leading-6">
              {warning}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
