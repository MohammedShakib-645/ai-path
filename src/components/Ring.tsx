import React from "react";

export default function Ring({
  pct,
  size = 120,
  strokeWidth = 10,
}: {
  pct: number;
  size?: number;
  strokeWidth?: number;
}) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const strokeDashoffset = c - (c * Math.min(100, Math.max(0, pct))) / 100;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="transform -rotate-90"
      >
        {/* Track circle */}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-[400ms] ease-out"
        />
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[24px] font-black text-slate-900 tracking-tight leading-none">
          {pct}%
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
          Complete
        </span>
      </div>
    </div>
  );
}
