"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import TopHeader from "../../components/TopHeader";
import { Map, LayoutGrid } from "lucide-react";
import PathView from "../../components/views/PathView";
import CatalogView from "../../components/views/CatalogView";

type Tab = "roadmap" | "catalog";

/** Learn — single entry for path + catalog (Courses / Learning Path / AI Roadmap merged).
 *  Old URLs redirect here (next.config): /courses lands with ?view=catalog. */
function LearnInner() {
  const view = useSearchParams().get("view");
  const urlTab: Tab = view === "catalog" ? "catalog" : "roadmap";

  // Tab = URL (`?view=`) unless the user clicked one — cleared when the URL changes,
  // adjusted during render (no setState-in-effect; React's documented derive pattern).
  const [override, setOverride] = useState<Tab | null>(null);
  const [prevView, setPrevView] = useState(view);
  if (prevView !== view) {
    setPrevView(view);
    setOverride(null);
  }
  const tab = override ?? urlTab;

  return (
    <div>
      <TopHeader title="Learn" subtitle="Your roadmap and course catalog — study from one place" />

      <div className="flex justify-end -mt-1 mb-4">
        <div role="tablist" aria-label="Learn view" className="inline-flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 gap-1">
          {([["roadmap", "Roadmap", Map], ["catalog", "Catalog", LayoutGrid]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setOverride(id)}
              className={`flex items-center gap-1.5 px-4 h-11 rounded-lg text-[13px] font-bold transition ${
                tab === id
                  ? "bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* keyed so the entrance animation replays on tab switch */}
      <div key={tab} className="page-enter">
        {tab === "roadmap" ? <PathView embedded /> : <CatalogView embedded />}
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnInner />
    </Suspense>
  );
}
