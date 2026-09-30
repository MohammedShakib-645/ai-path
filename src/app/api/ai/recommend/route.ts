// POST /api/ai/recommend { profile } → today's focus JSON (from REAL activity)
import { aiJSON } from "../../../../lib/ai";

const FALLBACK = { focus: "Python Basics", why: "Keep the streak alive — continue your current unit.", actions: ["Start lesson", "Practice", "Ask AI"] };

export async function POST(req: Request) {
  const { profile = "" } = await req.json().catch(() => ({}));
  const { data, engine } = await aiJSON(
    `Given this learner's REAL progress summary, pick ONE focus topic for today. Return JSON: focus (topic name), why (one line tied to their weak scores), actions (array of 3 short strings).`,
    `Learner summary: ${String(profile).slice(0, 1500)}`,
    FALLBACK
  );
  return Response.json({ recommendation: data, engine });
}
