// POST /api/ai/lesson { topic, level } → structured lesson JSON
import { aiJSON } from "../../../../lib/ai";

export interface Lesson {
  topic: string;
  intro: string;
  analogy: string;
  syntax: string;
  examples: { title: string; code: string; explain: string }[];
  mistakes: string[];
  points: string[];
  practice: string[];
  quiz: { q: string; options: string[]; answer: number; tip: string }[];
  challenge: string;
  summary: string;
}

/** Honest fallback: null → the client shows its "engine offline" card.
 *  A dummy lesson (generic print('hello') content) must NEVER reach the UI. */
export async function POST(req: Request) {
  const { topic = "Python Basics", level = "Beginner" } = await req.json().catch(() => ({}));
  const { data, engine } = await aiJSON<Lesson | null>(
    `Generate a complete ${level}-level programming lesson on "${topic}". Return ONLY one JSON object, no markdown, with exactly these keys: topic (string), intro (2-3 sentences), analogy (one real-world comparison), syntax (code block as plain string), examples (2-3 objects {title, code, explain}), mistakes (3 short strings), points (4 short strings), practice (3 short tasks), quiz (exactly 3 objects {q, options[4 strings], answer: 0-3, tip}), challenge (one sentence), summary (one sentence).`,
    `Lesson topic: ${topic}. Level: ${level}.`,
    null
  );
  return Response.json({ lesson: data, engine });
}
