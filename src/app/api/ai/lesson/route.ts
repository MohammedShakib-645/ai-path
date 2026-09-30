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

const FALLBACK: Lesson = {
  topic: "Topic",
  intro: "AI service is unavailable right now — showing a starter outline. Connect cloud keys for full lessons.",
  analogy: "Learning builds like layers.",
  syntax: "# syntax appears here",
  examples: [{ title: "Example", code: "print('hello')", explain: "Prints hello." }],
  mistakes: ["Skipping practice"],
  points: ["Practice daily"],
  practice: ["Write one small program on this topic."],
  quiz: [{ q: "What does print('hi') do?", options: ["Prints hi", "Error", "Nothing", "Asks input"], answer: 0, tip: "print outputs text." }],
  challenge: "Build a tiny script using this topic.",
  summary: "Review the example once more.",
};

export async function POST(req: Request) {
  const { topic = "Python Basics", level = "Beginner" } = await req.json().catch(() => ({}));
  const { data, engine } = await aiJSON<Lesson>(
    `Generate a complete ${level}-level programming lesson. Quiz: exactly 3 questions, 4 options each, answer = correct option index (0-3). Examples: 2-3 with runnable code.`,
    `Lesson topic: ${topic}`,
    { ...FALLBACK, topic }
  );
  return Response.json({ lesson: data, engine });
}
