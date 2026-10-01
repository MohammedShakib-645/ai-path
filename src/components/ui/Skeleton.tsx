/** Hydration skeleton — shown while localStorage state loads (never fake data). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-white/10 ${className}`}
    />
  );
}

/** Stat-shaped skeleton row used by dashboard/progress while hydrating. */
export function SkeletonStat({ label }: { label?: string }) {
  return (
    <div className="card p-5" aria-busy data-testid={label ? `skeleton-${label}` : "skeleton"}>
      <Skeleton className="h-3.5 w-28 mb-3" />
      <Skeleton className="h-7 w-16 mb-2" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}
