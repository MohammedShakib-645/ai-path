import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Standard page header: title + one-line description + primary action.
 *  Every page except the Dashboard uses this (no gradient banners elsewhere). */
export function PageHeader({
  title,
  description,
  action,
  backHref,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 flex-wrap ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <Link href={backHref} aria-label="Go back" className="text-[var(--muted)] hover:text-indigo-600 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-[26px] md:text-[30px] font-extrabold text-[#101a3f] dark:text-slate-50 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </div>
  );
}
