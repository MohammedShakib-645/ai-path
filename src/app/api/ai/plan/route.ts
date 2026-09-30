// POST /api/ai/plan { goal, hoursPerDay, targetDate, level } → study plan JSON
import { aiJSON } from "../../../../lib/ai";

const FALLBACK = {
  days: [
    { date: "Day 1", tasks: [{ id: "t1", text: "Review Python basics (45 min)", done: false }] },
    { date: "Day 2", text: "", tasks: [{ id: "t2", text: "Practice + mini quiz (45 min)", done: false }] },
  ],
};

export async function POST(req: Request) {
  const { goal = "Learn Python", hoursPerDay = 1, targetDate = "", level = "Beginner" } = await req.json().catch(() => ({}));
  const { data, engine } = await aiJSON(
    `Build a day-by-day study plan. Return JSON: days[] with {date ("Day N"), tasks[] with {id ("tN"), text, done:false}}. Max 14 days. Each task under ${hoursPerDay}h/day total. Mix lessons, practice, revision, quizzes.`,
    `Goal: ${goal}. Hours/day: ${hoursPerDay}. Target date: ${targetDate || "flexible"}. Level: ${level}.`,
    FALLBACK
  );
  const days = (Array.isArray((data as any).days) ? (data as any).days : []).slice(0, 14).map((d: any, i: number) => ({
    date: String(d.date ?? `Day ${i + 1}`),
    tasks: (Array.isArray(d.tasks) ? d.tasks : []).slice(0, 6).map((t: any, j: number) => ({
      id: String(t.id ?? `t${i}-${j}`),
      text: String(t.text ?? "Study task"),
      done: false,
    })),
  }));
  return Response.json({ days, engine });
}
