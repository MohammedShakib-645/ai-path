// POST /api/ai/quiz { topic, difficulty, count } → quiz JSON rendered by quiz engine
import { aiJSON } from "../../../../lib/ai";

export interface GenQ { q: string; code?: string; options: string[]; answer: number; tip: string; type: string }

const FALLBACK: { questions: GenQ[] } = {
  questions: [
    { q: "What does print(2 + 3) output?", options: ["5", "23", "Error", "None"], answer: 0, tip: "+ adds numbers.", type: "mcq" },
  ],
};

export async function POST(req: Request) {
  const { topic = "Python Basics", difficulty = "Easy", count = 5 } = await req.json().catch(() => ({}));
  const n = Math.max(1, Math.min(10, Number(count) || 5));
  const { data, engine } = await aiJSON<{ questions: GenQ[] }>(
    `Generate exactly ${n} ${difficulty} quiz questions on "${topic}". Mix types: mcq, true_false (options ["True","False"]), code_output (include "code"). Every question: q, options (4 for mcq, 2 for true_false), answer = correct index, tip (one-line explanation), type.\nReturn ONLY this JSON shape (no bare arrays): {"questions":[ ...the ${n} question objects... ]}`,
    `Topic: ${topic}. Difficulty: ${difficulty}. Count: ${n}.`,
    FALLBACK
  );
  // Tolerate a bare array reply (some models drop the wrapper).
  const rawQs = Array.isArray(data) ? (data as unknown as GenQ[]) : Array.isArray(data?.questions) ? data.questions : [];
  const questions = rawQs.slice(0, n).map((q, i) => ({
    q: String(q.q ?? `Question ${i + 1}`),
    code: q.code ? String(q.code) : undefined,
    options: Array.isArray(q.options) && q.options.length >= 2 ? q.options.map(String).slice(0, 4) : ["True", "False"],
    answer: Math.max(0, Math.min((Array.isArray(q.options) ? q.options.length : 2) - 1, Number(q.answer) || 0)),
    tip: String(q.tip ?? "Review this concept once more."),
    type: String(q.type ?? "mcq"),
  }));
  if (engine.startsWith("offline")) {
    return Response.json({ questions: [], engine, error: "AI is offline — no valid GROQ_KEYS/GEMINI_KEYS configured yet." });
  }
  return Response.json({ questions, engine });
}
