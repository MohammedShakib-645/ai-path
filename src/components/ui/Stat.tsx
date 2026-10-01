import { ReactNode } from "react";

/** Single stat display: label, real value, optional sub — tabular numbers. */
export function Stat({
  label,
  value,
  sub,
  icon,
  className = "",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${className}`}>
      {icon && (
        <span className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-white/5 flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-extrabold text-[14px] text-[#101a3f] dark:text-slate-100 stat-num">{value}</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
        {sub}
      </span>
    </div>
  );
}
