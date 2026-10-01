import type { MDXComponents } from "mdx/types";

/** Design-token styling for every element MDX lessons render (Phase 4).
 *  One map for all lessons — no per-lesson styling drift, dark-mode aware.
 *  Typed as the official MDXComponents so authored .mdx files and this map
 *  share one source of truth (props are contextually typed per element). */
export const mdxComponents: MDXComponents = {
  h1: ({ children }) => (
    <h2 className="font-extrabold text-[24px] tracking-tight text-[#101a3f] dark:text-slate-50 mt-1 mb-3">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="font-extrabold text-[17px] text-[#101a3f] dark:text-slate-50 mt-7 mb-2 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="font-bold text-[14.5px] text-indigo-800 dark:text-indigo-300 mt-5 mb-1.5">{children}</h4>
  ),
  h4: ({ children }) => (
    <h5 className="font-bold text-[13.5px] text-slate-700 dark:text-slate-200 mt-4 mb-1.5">{children}</h5>
  ),
  p: ({ children }) => (
    <p className="text-[13.5px] text-slate-600 dark:text-slate-300 leading-relaxed my-2.5">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 text-[13px] text-slate-600 dark:text-slate-300 space-y-1.5 my-2.5 marker:text-indigo-400">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 text-[13px] text-slate-600 dark:text-slate-300 space-y-1.5 my-2.5 marker:text-indigo-500 marker:font-bold">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-extrabold text-[#101a3f] dark:text-slate-100">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-300 underline underline-offset-2 font-medium">
      {children}
    </a>
  ),
  hr: () => <hr className="border-slate-200 dark:border-white/10 my-6" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/10 pl-4 pr-3 py-2.5 rounded-r-xl my-4 text-[13px] text-slate-600 dark:text-slate-300 [&_p]:my-0 [&_strong]:text-indigo-800 dark:[&_strong]:text-indigo-200">
      {children}
    </blockquote>
  ),
  pre: ({ children, className }) => (
    <pre className={`bg-[#0e1530] text-slate-100 text-[12px] p-4 rounded-xl overflow-x-auto font-mono whitespace-pre my-4 ${className ?? ""}`}>
      {children}
    </pre>
  ),
  code: ({ children, className }) =>
    className?.includes("language-") ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-[0.9em] text-indigo-700 dark:text-indigo-300">{children}</code>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-[12.5px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50 dark:bg-white/5">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-slate-200 dark:border-white/10 px-3 py-2 text-left font-bold text-[#101a3f] dark:text-slate-100">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-slate-200 dark:border-white/10 px-3 py-2 text-slate-600 dark:text-slate-300 align-top">{children}</td>
  ),
};
