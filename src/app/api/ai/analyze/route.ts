// POST /api/ai/analyze { code, language } → code review JSON
import { aiJSON } from "../../../../lib/ai";

const FALLBACK = {
  explanation: "AI service unavailable — paste again after connecting cloud keys.",
  bugs: [] as string[],
  issues: [] as string[],
  time: "n/a",
  space: "n/a",
  improvements: [] as string[],
  fixedCode: "",
};

export async function POST(req: Request) {
  const { code = "", language = "Python" } = await req.json().catch(() => ({}));
  if (!String(code).trim()) {
    return Response.json({ analysis: { ...FALLBACK, explanation: "Paste some code first." }, engine: "mock" });
  }
  const { data, engine } = await aiJSON(
    `Analyze ${language} code. Return JSON: explanation (2-3 lines), bugs[] (real bugs or []), issues[] (edge cases/smells), time (Big-O), space (Big-O), improvements[] (concrete), fixedCode (corrected full code in a plain string, "" if none needed).`,
    `Language: ${language}\nCode:\n${String(code).slice(0, 4000)}`,
    FALLBACK
  );
  return Response.json({ analysis: data, engine });
}
