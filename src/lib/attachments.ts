// Shared file-attachment intake for AI chats (paste Ctrl+V or upload).
// Images/PDFs become base64 (sent with the request, never stored in history);
// text files are inlined as plain text. Every rejection comes back as a
// human-readable error — nothing is dropped silently.
export type Attachment = { name: string; mime: string; kind: "image" | "pdf" | "text"; data: string; preview?: string };

const CAPS = { image: 6_000_000, pdf: 5_000_000, text: 200_000 };

export async function readAttachmentFiles(files: FileList | File[]): Promise<{ atts: Attachment[]; errors: string[] }> {
  const atts: Attachment[] = [];
  const errors: string[] = [];
  for (const f of Array.from(files)) {
    const isImg = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    const isText = f.type.startsWith("text/") || f.type === "application/json" || /\.(txt|md|csv|json|py)$/i.test(f.name);
    if (!isImg && !isPdf && !isText) {
      errors.push(`${f.name}: unsupported type — use an image, PDF or text file`);
      continue;
    }
    const kind: Attachment["kind"] = isImg ? "image" : isPdf ? "pdf" : "text";
    const cap = CAPS[kind];
    if (f.size > cap) {
      errors.push(`${f.name} is too large (max ${Math.round(cap / 1e6)} MB)`);
      continue;
    }
    try {
      if (kind === "text") {
        const txt = await f.text();
        atts.push({ name: f.name, mime: f.type || "text/plain", kind, data: txt.slice(0, 40000) });
      } else {
        const b64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result).split(",")[1] || "");
          r.onerror = () => rej(new Error("read"));
          r.readAsDataURL(f);
        });
        const mime = f.type || (kind === "pdf" ? "application/pdf" : "image/png");
        atts.push({ name: f.name, mime, kind, data: b64, preview: kind === "image" ? `data:${mime};base64,${b64}` : undefined });
      }
    } catch {
      errors.push(`Could not read ${f.name}`);
    }
  }
  return { atts, errors };
}
