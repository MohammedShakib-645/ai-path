import type { ReactNode } from "react";

/** Markdown — the one shared renderer for every AI text surface.
 *  JSX output only (no dangerouslySetInnerHTML → XSS-safe), streaming-tolerant
 *  (half-finished fences/lists fall back to literal text), dark-mode aware.
 *  Also strips the trailing "FOLLOWUPS:" metadata line the chat model emits —
 *  transport data is never meant for display; use parseFollowups() for chips. */

export interface MarkdownProps {
  text: string;
  className?: string;
  /** Custom fenced-code renderer (ai-tutor injects run/copy controls). */
  renderCode?: (code: string, lang: string, index: number, key: string) => ReactNode;
}

/** Splits the model's trailing "FOLLOWUPS: [..]" line into body + tappable questions. */
export function parseFollowups(text: string): { body: string; followups: string[] } {
  const m = /(^|\n)FOLLOWUPS:/.exec(text);
  if (!m) return { body: text, followups: [] };
  const cut = m.index + m[1].length;
  const body = text.slice(0, cut).replace(/\s+$/, "");
  const rest = text.slice(cut + "FOLLOWUPS:".length).replace(/`/g, "");
  try {
    const s = rest.indexOf("[");
    const e = rest.lastIndexOf("]");
    if (s >= 0 && e > s) {
      const arr: unknown = JSON.parse(rest.slice(s, e + 1));
      if (Array.isArray(arr)) {
        return {
          body,
          followups: arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 3),
        };
      }
    }
  } catch { /* still streaming or malformed — body is cut, chips appear later */ }
  return { body, followups: [] };
}

const INLINE_RE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(__[^_\n]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(\[[^\]\n]+\]\([^)\s]+\))/g;
const HEAD_RE = /^(#{1,4})\s+(.*)$/;
const UL_RE = /^\s*[-*+]\s+/;
const OL_RE = /^\s*\d+[.)]\s+/;
const BLOCK_START_RE = /^(#{1,4}\s|```|>\s?|[-*+]\s|\d+[.)]\s)/;

function safeHref(url: string): string | undefined {
  const u = url.trim();
  return /^(https?:\/\/|mailto:)/i.test(u) ? u : undefined;
}

/** inline: `code`, **bold**, *italic*, [text](url) — strings + keyed elements. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  INLINE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${n++}`;
    if (tok.startsWith("`")) {
      out.push(
        <code key={key} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[0.9em]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("**") || tok.startsWith("__")) {
      out.push(<strong key={key} className="font-extrabold">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("[")) {
      const mm = /^\[([^\]\n]+)\]\(([^)\s]+)\)$/.exec(tok);
      const href = mm ? safeHref(mm[2]) : undefined;
      out.push(
        mm && href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-300 underline underline-offset-2 font-medium">
            {mm[1]}
          </a>
        ) : (
          tok
        )
      );
    } else {
      out.push(<em key={key} className="italic">{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text, className = "", renderCode }: MarkdownProps) {
  const { body } = parseFollowups(text);
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let block = 0;

  while (i < lines.length) {
    const line = lines[i];

    // fenced code — an unclosed fence (mid-stream) still renders what we have
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence
      const code = buf.join("\n");
      const idx = block++;
      const key = `code-${idx}`;
      out.push(
        renderCode ? (
          <MarkdownCode key={key} node={renderCode(code, lang, idx, key)} />
        ) : (
          <pre key={key} className="my-2 bg-[#0e1530] text-slate-100 text-[12px] p-3 rounded-xl overflow-x-auto font-mono whitespace-pre">
            {code}
          </pre>
        )
      );
      continue;
    }

    // heading (rendered as sized bold line — keeps AI replies compact)
    const h = HEAD_RE.exec(line);
    if (h) {
      const lvl = h[1].length;
      out.push(
        <p key={`head-${i}`} className={`font-extrabold mt-3 mb-1 first:mt-0 text-[#101a3f] dark:text-slate-50 ${lvl <= 2 ? "text-[15px]" : "text-[13.5px]"}`}>
          {inline(h[2], `h${i}`)}
        </p>
      );
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push(<hr key={`hr-${i}`} className="border-slate-200 my-3 dark:border-white/10" />);
      i++;
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(
        <blockquote key={`quote-${i}`} className="border-l-[3px] border-indigo-300 dark:border-indigo-500/50 pl-3 italic text-slate-600 dark:text-slate-400 my-2 whitespace-pre-wrap">
          {inline(buf.join("\n"), `q${i}`)}
        </blockquote>
      );
      continue;
    }

    // unordered list
    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i])) {
        items.push(lines[i].replace(UL_RE, ""));
        i++;
      }
      out.push(
        <ul key={`ul-${i}`} className="list-disc pl-5 my-1.5 space-y-1 marker:text-indigo-400">
          {items.map((t, j) => (
            <li key={j}>{inline(t, `u${i}-${j}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // ordered list
    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i])) {
        items.push(lines[i].replace(OL_RE, ""));
        i++;
      }
      out.push(
        <ol key={`ol-${i}`} className="list-decimal pl-5 my-1.5 space-y-1 marker:text-indigo-400 marker:font-bold">
          {items.map((t, j) => (
            <li key={j}>{inline(t, `o${i}-${j}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // blank line between blocks
    if (!line.trim()) {
      i++;
      continue;
    }

    // paragraph — keeps hard line breaks (whitespace-pre-wrap)
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !BLOCK_START_RE.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed whitespace-pre-wrap">
        {inline(buf.join("\n"), `p${i}`)}
      </p>
    );
  }

  return <div className={className}>{out}</div>;
}

/** Wraps custom code nodes so the parent list gets a stable key without extra DOM. */
function MarkdownCode({ node }: { node: ReactNode }) {
  return <>{node}</>;
}
