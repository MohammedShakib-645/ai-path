// Server-side AI service. Keys NEVER leave the server.
// Pool: GROQ_KEYS (primary) -> GEMINI_KEYS (backup), round-robin + 90s cooldown.
import { cloudChat } from "./llm";

export interface ChatMsg { role: "system" | "user" | "assistant"; content: string | Array<{ type: string; [k: string]: any }> }

export const TUTOR_MODES: Record<string, { label: string; system: string }> = {
  explain: { label: "Explain", system: "Explain the concept simply with one short example. End with a check question." },
  teach: { label: "Teach Me", system: "Teach step-by-step like a patient tutor: concept, analogy, example, then a tiny exercise. Keep each step short." },
  debug: { label: "Debug Code", system: "User pastes code. Return exactly: 1) Problem 2) Why it happens 3) Fixed version in a ``` code block 4) Explanation 5) Better approach 6) Test cases." },
  review: { label: "Code Review", system: "Review pasted code: bugs, edge cases, complexity (time+space), style, and an improved version in a ``` block." },
  generate: { label: "Generate Code", system: "Generate clean, commented code for the request plus a one-line usage example and one common pitfall." },
  practice: { label: "Practice Me", system: "Give ONE practice problem at the user's level with input/output example. Don't solve it — give a hint only if asked." },
  interview: { label: "Interview Me", system: "Ask ONE interview question at a time. Wait for the answer, then grade it and explain the ideal answer." },
  exam: { label: "Exam Prep", system: "Quiz the user with exam-style questions one at a time, grade answers, track weak points, summarize at the end." },
  mentor: { label: "Project Mentor", system: "Guide the user's project: break it into milestones, suggest stack, give starter code, review progress step by step." },
  planner: { label: "Study Planner", system: "Create a concrete day-by-day study plan from the user's goal, hours/day and deadline. Be specific with topics and practice tasks." },
};

/** Plain chat with mode-aware system prompt. */
export async function aiChat(mode: string, profile: string, messages: ChatMsg[]) {
  const m = TUTOR_MODES[mode] ?? TUTOR_MODES.explain;
  return cloudChat([
    { role: "system", content: `${m.system}\n\nLearner context (adapt depth/tone): ${profile}${STRUCTURE}` },
    ...messages,
  ]);
}

// Hard output rules — the tutor NEVER dumps a wall of text.
const STRUCTURE = `

OUTPUT RULES (always follow):
1. First line = the direct answer or definition in one sentence.
2. Then structure with short sections: **Why it matters**, **How it works**, **Example**, **Quick recap** — only the ones that fit.
3. Use bullet points or numbered steps for anything with 2+ items. Never long paragraphs.
4. Bold key terms. Put code in \`\`\` blocks with a one-line comment.
5. End with one check question (one line).
6. Plain English, max ~150 words unless the learner asks for depth. No filler, no repeating the question.`;

/** Ask for strict JSON; repairs markdown fences; validates with fallback. NEVER throws. */
export async function aiJSON<T>(system: string, user: string, fallback: T): Promise<{ data: T; engine: string }> {
  let reply: string;
  let engine: string;
  try {
    const r = await cloudChat([
      { role: "system", content: system + "\nReturn ONLY valid JSON, no markdown fences, no commentary." },
      { role: "user", content: user },
    ]);
    reply = r.reply;
    engine = r.engine;
  } catch (e: any) {
    // No keys / all keys cooling down → caller still gets valid data.
    return { data: fallback, engine: `offline (${String(e?.message ?? e).slice(0, 80)})` };
  }
  const clean = reply.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return { data: JSON.parse(clean) as T, engine };
  } catch {
    const s = clean.indexOf("{");
    const e = clean.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try {
        return { data: JSON.parse(clean.slice(s, e + 1)) as T, engine };
      } catch { /* fall through */ }
    }
    return { data: fallback, engine: engine + "+fallback" };
  }
}
