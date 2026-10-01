"use client";
import type { ReactNode } from "react";

/**
 * MarkdownLite — a deliberately tiny markdown renderer for AI replies.
 * Supports: ```code fences```, **bold**, lines that are fully **bold** (headings),
 * "- "/"* " bullet lists and "1. / 1)" numbered lists. Nothing else.
 */

type Seg =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

const FENCE_LANGS = [
  "python", "py", "js", "javascript", "jsx", "ts", "typescript", "tsx",
  "java", "cpp", "c++", "c", "cs", "csharp", "go", "rust", "sql", "bash",
  "sh", "shell", "json", "html", "css", "xml", "yaml", "yml", "md", "text", "txt",
];

function inline(text: string, k: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith("**") && part.endsWith("**") ? (
      <b key={`${k}b${i}`} className="font-extrabold">{part.slice(2, -2)}</b>
    ) : (
      <span key={`${k}s${i}`}>{part}</span>
    )
  );
}

function toSegs(text: string): Seg[] {
  const segs: Seg[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    segs.push(list.ordered ? { type: "ol", items: list.items } : { type: "ul", items: list.items });
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet) {
      if (!list || list.ordered) { flush(); list = { ordered: false, items: [] }; }
      list.items.push(bullet[1]);
      continue;
    }
    if (numbered) {
      if (!list || !list.ordered) { flush(); list = { ordered: true, items: [] }; }
      list.items.push(numbered[1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const head = line.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (head) segs.push({ type: "h", text: head[1] });
    else segs.push({ type: "p", text: line });
  }
  flush();
  return segs;
}

function stripLang(part: string): string {
  const nl = part.indexOf("\n");
  if (nl > 0 && FENCE_LANGS.includes(part.slice(0, nl).trim().toLowerCase())) {
    return part.slice(nl + 1).replace(/\s+$/, "");
  }
  return part.replace(/^\n/, "").replace(/\s+$/, "");
}

export default function MarkdownLite({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/```/g);
  return (
    <div className={`text-[13.5px] leading-relaxed ${className}`}>
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <pre key={i} className="my-2 rounded-xl bg-[#0e1530] text-slate-100 text-[12px] p-3.5 overflow-x-auto font-mono whitespace-pre border border-[#1b2650]">
              {stripLang(part)}
            </pre>
          );
        }
        if (!part.trim()) return null;
        return (
          <div key={i}>
            {toSegs(part).map((s, j) => {
              const k = `${i}-${j}`;
              if (s.type === "ul") {
                return (
                  <ul key={j} className="list-disc pl-5 my-1.5 space-y-1">
                    {s.items.map((t, n) => <li key={n}>{inline(t, `${k}-${n}`)}</li>)}
                  </ul>
                );
              }
              if (s.type === "ol") {
                return (
                  <ol key={j} className="list-decimal pl-5 my-1.5 space-y-1">
                    {s.items.map((t, n) => <li key={n}>{inline(t, `${k}-${n}`)}</li>)}
                  </ol>
                );
              }
              if (s.type === "h") {
                return <div key={j} className="font-extrabold text-[#101a3f] text-[14px] mt-3 mb-1 first:mt-0">{inline(s.text, k)}</div>;
              }
              return <div key={j} className="whitespace-pre-wrap">{inline(s.text, k)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}
