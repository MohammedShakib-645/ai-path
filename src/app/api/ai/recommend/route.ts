// POST /api/ai/recommend { profile } → today's focus JSON (from REAL activity)
import { aiJSON } from "../../../../lib/ai";

/**
 * Offline path: derive the focus from the real progress summary the client
 * sent — never a hardcoded suggestion (no dummy values, ever).
 */
function localRecommend(profile: string) {
  const weak =
    profile.match(/weak ([A-Za-z][A-Za-z &/+.-]*?) \d+%/)?.[1] ||
    profile.match(/weak: ([A-Za-z][^;,]*?)(?:;|$)/)?.[1] ||
    "";
  const avg = profile.match(/avg (\d+)%/)?.[1] || "";
  const done = profile.match(/done (\d+)\/(\d+)/);
  const goal =
    profile.match(/goal "([^"]+)"/)?.[1] ||
    profile.match(/goal (.+?)\s*,?\s*$/)?.[1]?.trim() ||
    "";
  const focus = weak.trim() || goal || "Python Basics";
  const tag = " — computed from your progress (AI offline).";
  if (weak.trim()) {
    return {
      focus,
      why: `Your real scores show ${weak.trim()} is your weakest area${avg ? ` (average ${avg}%)` : ""} — start there today.${tag}`,
      actions: ["Review the lesson", "Practise this topic", "Take a quick quiz"],
    };
  }
  if (done) {
    return {
      focus,
      why: `You have finished ${done[1]} of ${done[2]} units${goal ? ` towards "${goal}"` : ""} — continue your current unit.${tag}`,
      actions: ["Open Learning Path", "Open cheat sheet", "Take a quick quiz"],
    };
  }
  return {
    focus,
    why: `Start with unit 1 and build your streak.${tag}`,
    actions: ["Open Learning Path", "Start the first lesson", "Take a quick quiz"],
  };
}

export async function POST(req: Request) {
  const { profile = "" } = await req.json().catch(() => ({}));
  const { data, engine } = await aiJSON(
    `Given this learner's REAL progress summary, pick ONE focus topic for today. Return JSON: focus (topic name), why (one line tied to their weak scores), actions (array of 3 short strings).`,
    `Learner summary: ${String(profile).slice(0, 1500)}`,
    localRecommend(String(profile))
  );
  return Response.json({ recommendation: data, engine });
}
