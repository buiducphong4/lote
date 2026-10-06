import { AlertTriangle } from "lucide-react";

export function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null;

  return (
    <div
      role="status"
      className="warn-panel rounded-xl p-3 text-sm"
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
