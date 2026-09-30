"use client";
import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

export function toast(msg: string, kind: "ok" | "err" | "info" = "ok") {
  window.dispatchEvent(new CustomEvent("ai-path-toast", { detail: { msg, kind, id: Date.now() } }));
}

export default function Toaster() {
  const [items, setItems] = useState<{ msg: string; kind: string; id: number }[]>([]);
  useEffect(() => {
    const fn = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setItems((x) => [...x, d]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== d.id)), 2600);
    };
    window.addEventListener("ai-path-toast", fn);
    return () => window.removeEventListener("ai-path-toast", fn);
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-[100] space-y-2 w-[320px]">
      {items.map((t) => (
        <div key={t.id} className="card !rounded-xl px-4 py-3 text-[13px] font-medium flex items-center gap-2 shadow-lg">
          {t.kind === "ok" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
          {t.kind === "err" && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
          {t.kind === "info" && <Info className="w-4 h-4 text-blue-500 shrink-0" />}
          <span className="text-slate-700">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
