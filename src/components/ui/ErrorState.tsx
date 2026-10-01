import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "./Button";

/** Friendly, actionable error state — never a blank screen. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center text-center rounded-2xl border border-red-200 bg-red-50/60 dark:border-red-500/20 dark:bg-red-500/10 px-6 py-8">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="font-bold text-[15px] text-red-800 dark:text-red-300">{title}</h3>
      {message && <p className="text-[12.5px] text-red-700/80 dark:text-red-300/80 mt-1 max-w-[400px]">{message}</p>}
      {onRetry && (
        <Button variant="danger" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCcw className="w-3.5 h-3.5" /> {retryLabel}
        </Button>
      )}
    </div>
  );
}
