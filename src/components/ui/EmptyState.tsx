import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "./Button";

/** Honest empty state — illustration + one sentence + one clear CTA. */
export function EmptyState({
  icon = "✨",
  title,
  body,
  cta,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  cta?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 px-6 py-8 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-[26px] mb-3">
        {icon}
      </div>
      <h3 className="font-bold text-[15px] text-[#101a3f] dark:text-slate-100">{title}</h3>
      {body && <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-[340px]">{body}</p>}
      {cta &&
        (cta.href ? (
          <Link
            href={cta.href}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl primary-gradient text-white font-bold text-[13px] hover:-translate-y-0.5 transition"
          >
            {cta.label} <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Button className="mt-4" onClick={cta.onClick}>
            {cta.label}
          </Button>
        ))}
    </div>
  );
}
