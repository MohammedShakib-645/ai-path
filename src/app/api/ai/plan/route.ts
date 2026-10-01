// POST /api/ai/plan { goal, hoursPerDay, targetDate, level } → study plan JSON
import { aiJSON } from "../../../../lib/ai";

interface RawTask { id?: string; text?: string; done?: boolean }
interface RawDay { date?: string; tasks?: RawTask[] }

const FALLBACK: { days: RawDay[] } = {
  days: [
    { date: "Day 1", tasks: [{ id: "t1", text: "Review Python basics (45 min)", done: false }] },
    { date: "Day 2", tasks: [{ id: "t2", text: "Practice + mini quiz (45 min)", done: false }] },
  ],
};

export async function POST(req: Request) {
  const { goal = "Learn Python", hoursPerDay = 1, targetDate = "", level = "Beginner" } = await req.json().catch(() => ({}));
  const { data, engine } = await aiJSON<{ days: RawDay[] }>(
    `Build a day-by-day study plan. Return ONLY one JSON object: {"days":[...]} where each day is {date ("Day N"), tasks:[{id ("tN"), text, done:false}]}. Max 14 days, 2-3 tasks per day, each day's tasks summing to under ${hoursPerDay}h. Mix lessons, practice, revision, quizzes. No commentary, no markdown.`,
    `Goal: ${goal}. Hours/day: ${hoursPerDay}. Target date: ${targetDate || "flexible"}. Level: ${level}.`,
    FALLBACK
  );
  // Tolerate a bare array reply (some models drop the wrapper).
  const planDays: RawDay[] = Array.isArray(data)
    ? (data as unknown as RawDay[])
    : Array.isArray(data.days)
      ? data.days
      : [];
  const days = planDays.slice(0, 14).map((d, i) => ({
    date: String(d.date ?? `Day ${i + 1}`),
    tasks: (Array.isArray(d.tasks) ? d.tasks : []).slice(0, 6).map((t, j) => ({
      id: String(t.id ?? `t${i}-${j}`),
      text: String(t.text ?? "Study task"),
      done: false,
    })),
  }));
  return Response.json({ days, engine });
}
