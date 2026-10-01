"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import TopHeader from "../../components/TopHeader";
import Markdown from "../../components/Markdown";
import { toast } from "../../components/Toaster";
import { INTERVIEW_TRACKS } from "../../lib/curriculum";
import { recordQuiz, logActivity } from "../../lib/store";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, Mic, RotateCcw,
  Sparkles, Target, TrendingUp, AlertTriangle,
  Video, VideoOff, Volume2, VolumeX,
} from "lucide-react";

/** Clock helper lives at module scope — handlers call it, never the render path. */
const nowMs = () => Date.now();

/** Minimal Web Speech API typings (not in lib.dom yet). */
type RecogEvent = { results: { length: number; [i: number]: { 0: { transcript: string } } } };
interface SpeechRec {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort?(): void;
  onresult: ((e: RecogEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
const getRecogCtor = (): (new () => SpeechRec) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

type EvalResult = {
  score: number;          // 0–5
  reply: string;          // raw AI evaluation (or local fallback text)
  missing: string;        // "MISSING:" section (may be empty)
  source: "ai" | "keyword";
  answer: string;         // the student's submitted answer (for review)
};

export default function InterviewPage() {
  const [stage, setStage] = useState<"pick" | "run" | "summary">("pick");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [draft, setDraft] = useState("");
  const [results, setResults] = useState<EvalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const startedAt = useRef(0);
  const recorded = useRef(false);

  // ── Camera / voice (all real browser APIs) ──
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recogRef = useRef<SpeechRec | null>(null);

  const attachVideo = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && streamRef.current) el.srcObject = streamRef.current;
  };
  const stopMedia = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const r = recogRef.current;
    if (r) { r.onend = null; r.onerror = null; r.onresult = null; r.abort?.(); recogRef.current = null; }
    setListening(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  useEffect(() => () => stopMedia(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // camera stream lifecycle (async getUserMedia — honest error states)
  useEffect(() => {
    if (!camOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      // deferred — setState directly inside an effect body is a cascading render
      const tid = window.setTimeout(() => { setCamErr("Camera needs HTTPS (or localhost)."); setCamOn(false); }, 0);
      return () => window.clearTimeout(tid);
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((st) => {
        if (cancelled) { st.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = st;
        if (videoRef.current) videoRef.current.srcObject = st;
        setCamErr("");
      })
      .catch(() => { setCamErr("Camera blocked — allow camera access in your browser, then retry."); setCamOn(false); });
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  }, [camOn]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  // AI interviewer reads each question aloud when voice is on
  // (effect lives below where `q` is declared — see run-stage section)

  const toggleListen = () => {
    if (listening) { recogRef.current?.stop(); setListening(false); return; }
    const Ctor = getRecogCtor();
    if (!Ctor) { toast("Voice input isn't supported here — try Chrome or Edge", "err"); return; }
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e) => {
      const txt = e.results[0]?.[0]?.transcript ?? "";
      if (txt) setDraft((d) => (d ? `${d} ${txt}` : txt));
    };
    r.onend = () => { setListening(false); recogRef.current = null; };
    r.onerror = () => { setListening(false); recogRef.current = null; toast("Mic blocked — allow microphone access", "err"); };
    recogRef.current = r;
    r.start();
    setListening(true);
  };

  const track = INTERVIEW_TRACKS.find((t) => t.id === trackId) ?? null;
  const total = track?.qs.length ?? 0;
  const q = track?.qs[idx];

  // AI interviewer reads each question aloud when voice is on.
  useEffect(() => {
    if (voiceOn && stage === "run" && q) speak(q.q);
    if (!voiceOn && typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOn, stage, trackId, idx]);

  const start = (id: string) => {
    setTrackId(id);
    setIdx(0);
    setDraft("");
    setResults([]);
    recorded.current = false;
    startedAt.current = nowMs();
    setStage("run");
  };

  const retake = () => {
    if (!track) return;
    setIdx(0);
    setDraft("");
    setResults([]);
    recorded.current = false;
    startedAt.current = nowMs();
    setStage("run");
  };

  // Honest fallback: how many of the question's key concepts appear in the answer.
  const keywordScore = (answer: string, keys: string[]): number => {
    const a = answer.toLowerCase();
    const matches = keys.filter((k) => a.includes(k.toLowerCase())).length;
    return Math.max(0, Math.min(5, Math.round((matches * 5) / Math.max(1, keys.length))));
  };

  const submitAnswer = async () => {
    if (!track || !q || loading) return;
    const answer = draft.trim();
    if (!answer) {
      toast("Type your answer first", "err");
      return;
    }
    setLoading(true);
    const kwScore = keywordScore(answer, q.keys);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "interview",
          profile: `Mock interview candidate practising for a ${track.label} interview`,
          messages: [{
            role: "user",
            content: `${q.q}\n\nStudent answer: ${answer}\n\nEvaluate: score this answer 0-5, list missing concepts, then give the ideal answer. Format: SCORE: x/5, MISSING: ..., BETTER ANSWER: ...`,
          }],
        }),
      });
      const d = await res.json().catch(() => ({ reply: "" }));
      const reply: string = typeof d?.reply === "string" ? d.reply : "";
      const failed = !reply || d?.error === "AI_UNAVAILABLE";
      const m = reply.match(/(\d)\s*\/\s*5/);
      const aiScore = m ? Math.max(0, Math.min(5, parseInt(m[1], 10))) : null;
      const useAI = !failed && aiScore !== null;
      const missing = useAI
        ? (reply.match(/MISSING:\s*([\s\S]*?)(?=BETTER ANSWER:|$)/i)?.[1] ?? "").trim()
        : `Keyword check: your answer mentioned ${q.keys.filter((k) => answer.toLowerCase().includes(k.toLowerCase())).length} of ${q.keys.length} key concepts (${q.keys.join(", ")}).`;
      const result: EvalResult = useAI
        ? { score: aiScore, reply, missing, source: "ai", answer }
        : {
            score: kwScore,
            reply: failed
              ? `AI evaluation is unavailable right now, so this score came from a keyword check of your answer against ${q.keys.length} key concepts. Retry later for a full written evaluation.\n\nYour answer: ${answer}`
              : reply || `Scored locally with a keyword check against ${q.keys.length} key concepts.`,
            missing,
            source: "keyword",
            answer,
          };
      setResults((r) => [...r, result]);
      setDraft("");
      if (!useAI) toast("AI score unavailable — used keyword check", "info");
    } catch {
      setResults((r) => [...r, {
        score: kwScore,
        reply: `AI request failed (network). Scored with a keyword check against ${q.keys.length} key concepts — press "Evaluate" again to retry the AI.`,
        missing: `Keyword check: matched ${q.keys.filter((k) => answer.toLowerCase().includes(k.toLowerCase())).length} of ${q.keys.length} key concepts (${q.keys.join(", ")}).`,
        source: "keyword",
        answer,
      }]);
      setDraft("");
      toast("AI unavailable — keyword check used", "info");
    } finally {
      setLoading(false);
    }
  };

  const current = results[idx] ?? null;

  const next = () => {
    if (!track) return;
    if (idx < total - 1) {
      setIdx((i) => i + 1);
      setDraft("");
      return;
    }
    // finished — record the real result once
    const score = results.reduce((s, r) => s + r.score, 0);
    const max = total * 5;
    const secs = Math.min(1800, Math.max(1, Math.round((nowMs() - startedAt.current) / 1000)));
    if (!recorded.current) {
      recorded.current = true;
      recordQuiz(`AI Interview: ${track.label}`, score, max, secs);
      logActivity(
        `Interview: ${track.label}`,
        `${score}/${max} (${Math.round((score / Math.max(1, max)) * 100)}%) across ${total} questions in ${Math.max(1, Math.round(secs / 60))} min`,
        "quiz"
      );
      toast(`Interview saved — ${score}/${max} ✓`);
    }
    stopMedia();
    setCamOn(false);
    setStage("summary");
  };

  const score = results.reduce((s, r) => s + r.score, 0);
  const max = total * 5;
  const pct = max ? Math.round((score / max) * 100) : 0;
  const weak = results.map((r, i) => ({ r, i })).filter(({ r }) => r.score <= 2);

  const scoreColor = (s: number) =>
    s >= 4 ? "bg-green-100 text-green-700 border-green-300"
      : s === 3 ? "bg-amber-100 text-amber-700 border-amber-300"
        : "bg-red-100 text-red-600 border-red-300";

  return (
    <div>
      {/* Header */}
      <TopHeader title="AI Interview Mode" subtitle="Camera + voice interview — answer out loud or in writing, graded 0–5" back="/dashboard" />

      {/* ── Stage 1: pick a track ─────────────────────────────── */}
      {stage === "pick" && (
        <div>
          <div className="card p-6 mb-4 flex items-center gap-4 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
            <div className="w-16 h-16 rounded-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/15 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300">
              <Mic className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-[220px]">
              <div className="font-extrabold text-[18px]">Pick your interview track</div>
              <div className="text-[12px] text-slate-500 dark:text-slate-400">Real questions, graded by AI. Each answer scores 0–5 marks.</div>
            </div>
            <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> AI-graded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {INTERVIEW_TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => start(t.id)}
                className="card p-5 text-left hover:-translate-y-1 hover:shadow-lg transition group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[26px] shrink-0 group-hover:scale-110 transition">{t.icon}</span>
                  <div>
                    <div className="font-extrabold text-[15px] text-[#101a3f]">{t.label}</div>
                    <div className="text-[11px] text-slate-500">{t.qs.length} questions • 0–{t.qs.length * 5} marks</div>
                  </div>
                </div>
                <p className="text-[12px] text-slate-500 line-clamp-2">{t.qs[0]?.q}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 group-hover:gap-2.5 transition-all">
                  Start interview <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Stage 2: one question at a time ───────────────────── */}
      {stage === "run" && track && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div>
            <div className="card p-5 flex items-center gap-4 mb-4 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
              <span className="w-14 h-14 rounded-full bg-white dark:bg-white/10 border border-indigo-200 dark:border-white/15 flex items-center justify-center text-[28px] shrink-0">{track.icon}</span>
              <div className="flex-1 min-w-[180px]">
                <div className="font-extrabold text-[17px]">{track.label} Interview</div>
                <div className="text-[12px] text-slate-500 dark:text-slate-400">Answer naturally — the AI grades depth, not keywords.</div>
              </div>
              <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">Question {idx + 1} of {total}</span>
              <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 flex items-center gap-1.5 font-semibold">
                <Target className="w-3.5 h-3.5" /> {score}/{max}
              </span>
            </div>

            <div className="card p-6">
              <div key={idx} className="pop-in">
                <div className="flex gap-4 mb-4 items-start">
                  <span className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-[18px] shrink-0">{idx + 1}</span>
                  <h2 className="font-extrabold text-[17px] text-[#101a3f] flex-1">{q?.q}</h2>
                  {q && (
                    <button
                      onClick={() => speak(q.q)}
                      title="Read question aloud"
                      className="shrink-0 w-9 h-9 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!current ? (
                  <>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={7}
                      placeholder="Type your answer here… explain the concept, give examples, mention trade-offs."
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[13.5px] leading-relaxed outline-none resize-y placeholder:text-slate-400"
                    />
                    <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                      <span className="text-[11px] text-slate-400 flex items-center gap-2">
                        {draft.trim().length} characters
                        <button
                          onClick={toggleListen}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition ${
                            listening ? "border-red-300 bg-red-50 text-red-600 animate-pulse" : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                          }`}
                        >
                          <Mic className="w-3.5 h-3.5" /> {listening ? "Listening… tap to stop" : "Dictate"}
                        </button>
                      </span>
                      <button
                        onClick={submitAnswer}
                        disabled={loading || !draft.trim()}
                        className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                      >
                        {loading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            AI is evaluating…
                          </>
                        ) : (
                          <>Evaluate my answer <Sparkles className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pop-in space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Your answer</div>
                      <Markdown text={current.answer} className="text-[13px] text-slate-600" />
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-extrabold text-[16px] ${scoreColor(current.score)}`}>
                        {current.score} / 5
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${current.source === "ai" ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                        {current.source === "ai" ? "AI evaluation" : "Keyword check (AI unavailable)"}
                      </span>
                    </div>

                    {current.missing && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                        <div className="text-[12px] font-extrabold text-amber-700 flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-4 h-4" /> Missing concepts
                        </div>
                        <Markdown text={current.missing} className="text-[13px] text-amber-900" />
                      </div>
                    )}

                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                      <div className="text-[12px] font-extrabold text-indigo-700 mb-1">Full evaluation &amp; ideal answer</div>
                      <Markdown text={current.reply} className="text-[13px] leading-relaxed text-slate-700" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6 gap-3">
                <button
                  onClick={() => { stopMedia(); setCamOn(false); setStage("pick"); setResults([]); setIdx(0); }}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md hover:text-slate-700"
                >
                  <ArrowLeft className="w-4 h-4" /> Change track
                </button>
                {current && (
                  <button
                    onClick={next}
                    className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {idx === total - 1 ? "See my summary" : "Next question"} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* right column */}
          <div className="space-y-4">
            {/* Interview room — real webcam + AI interviewer with voice */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[14px] text-[#101a3f] flex items-center gap-1.5"><Video className="w-4 h-4 text-indigo-500" /> Interview room</h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${speaking ? "bg-indigo-100 text-indigo-700" : listening ? "bg-red-100 text-red-600" : loading ? "bg-amber-100 text-amber-700" : camOn ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {speaking ? "● AI speaking" : listening ? "● Listening" : loading ? "● Evaluating" : camOn ? "● Camera live" : "Ready"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* your camera */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
                  {camOn && !camErr ? (
                    <video ref={attachVideo} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <VideoOff className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-semibold">Your camera</span>
                    </div>
                  )}
                  <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded">You</span>
                </div>
                {/* AI interviewer */}
                <div className={`relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 border flex items-center justify-center ${speaking ? "border-indigo-400 ring-2 ring-indigo-400/60 animate-pulse" : "border-indigo-700"}`}>
                  <div className="flex flex-col items-center">
                    <span className="text-[30px] leading-none">🤖</span>
                    <span className="text-[9px] font-bold text-indigo-200 mt-1">AI Interviewer</span>
                  </div>
                  <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/80 bg-black/40 px-1.5 py-0.5 rounded">AI</span>
                </div>
              </div>
              {camErr && <p className="text-[11px] text-red-500 mt-2">{camErr}</p>}
              <div className="grid grid-cols-3 gap-1.5 mt-3">
                <button
                  onClick={() => setCamOn((v) => !v)}
                  className={`text-[11px] font-bold py-2 rounded-lg border flex items-center justify-center gap-1 transition ${camOn ? "bg-green-50 border-green-200 text-green-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300"}`}
                >
                  <Video className="w-3.5 h-3.5" /> {camOn ? "Camera on" : "Camera off"}
                </button>
                <button
                  onClick={() => setVoiceOn((v) => !v)}
                  className={`text-[11px] font-bold py-2 rounded-lg border flex items-center justify-center gap-1 transition ${voiceOn ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300"}`}
                >
                  {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} {voiceOn ? "Voice on" : "Voice off"}
                </button>
                <button
                  onClick={toggleListen}
                  className={`text-[11px] font-bold py-2 rounded-lg border flex items-center justify-center gap-1 transition ${listening ? "bg-red-50 border-red-300 text-red-600 animate-pulse" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300"}`}
                >
                  <Mic className="w-3.5 h-3.5" /> {listening ? "Stop mic" : "Mic"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">Camera & mic stay in your browser — nothing is uploaded. Voice reads questions aloud; dictate fills your answer.</p>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Live score</h3>
              <div className="flex gap-1.5 flex-wrap">
                {track.qs.map((_, i) => {
                  const r = results[i];
                  return (
                    <span
                      key={i}
                      title={r ? `Question ${i + 1}: ${r.score}/5` : `Question ${i + 1}: not answered`}
                      className={`w-8 h-8 rounded-full text-[12px] font-bold flex items-center justify-center ${
                        r ? (r.score >= 3 ? "bg-green-500 text-white" : "bg-red-400 text-white")
                          : i === idx ? "bg-indigo-500 text-white ring-4 ring-indigo-100" : "bg-slate-100 text-slate-400"}`}
                    >
                      {r ? r.score : i + 1}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 text-[13px] text-slate-600 flex justify-between">
                <span>Answered {results.length} / {total}</span>
                <b className="text-[#101a3f]">{score}/{max}</b>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Interview tips</h3>
              <ul className="text-[12.5px] text-slate-600 space-y-1.5 list-disc pl-4">
                <li>Structure your answer: definition → example → trade-off.</li>
                <li>Mention real names (<b>SMOTE</b>, <b>k-fold</b>, <b>chain rule</b>) — keywords earn credit.</li>
                <li>If unsure, say what you DO know instead of guessing.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage 3: summary ──────────────────────────────────── */}
      {stage === "summary" && track && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div>
            <div className="card p-6 mb-4 flex items-center gap-5 flex-wrap border-indigo-100 bg-indigo-50/60 dark:border-white/10 dark:bg-white/5">
              <div className="relative w-[110px] h-[110px] shrink-0">
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(99,102,241,0.25)" strokeWidth="10" />
                  <circle
                    cx="55" cy="55" r="46" fill="none" stroke="#6366f1" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
                    transform="rotate(-90 55 55)"
                    style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(0.2,0.8,0.2,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <b className="text-[24px]">{pct}%</b>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">overall</span>
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="font-extrabold text-[20px] flex items-center gap-2">{track.icon} {track.label} interview done</div>
                <div className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">You scored <b>{score}</b> out of <b>{max}</b> marks across {total} questions.</div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">{score}/{max} marks</span>
                  <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">{pct}%</span>
                  <span className="text-[12px] border border-indigo-200 dark:border-white/15 rounded-full px-3 py-1.5 font-medium">{weak.length} weak {weak.length === 1 ? "area" : "areas"}</span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-3">Question-by-question result</h3>
              <div className="space-y-2.5">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 border rounded-xl px-3.5 py-3 ${r.score <= 2 ? "border-red-200 bg-red-50/50" : "border-slate-200"}`}>
                    <span className={`shrink-0 w-9 h-9 rounded-full border-2 font-extrabold text-[13px] flex items-center justify-center ${scoreColor(r.score)}`}>{r.score}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#101a3f] truncate">{track.qs[i]?.q}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.score <= 2 ? "Weak area — revisit this topic" : r.source === "ai" ? "AI-graded" : "Keyword-checked"}
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-slate-400 shrink-0">/5</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-5 flex-wrap">
                <button onClick={retake} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-[13px] font-bold flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-md">
                  <RotateCcw className="w-4 h-4" /> Retake this track
                </button>
                <Link href="/ai-tutor" className="px-6 py-2.5 rounded-xl primary-gradient text-white text-[13px] font-bold flex items-center gap-2 shadow hover:-translate-y-0.5 hover:shadow-lg">
                  Ask AI Tutor about weak areas →
                </Link>
              </div>

              <div className="mt-4 rounded-xl p-3.5 bg-emerald-50 border border-emerald-200 text-[13px] text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Saved to your progress — dashboard, transcript and activity updated live.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Weak areas (scored ≤ 2)</h3>
              {weak.length === 0 ? (
                <p className="text-[13px] text-slate-500">Nothing weak — every answer scored 3 or higher. Nice work! 🎉</p>
              ) : (
                <ul className="space-y-2">
                  {weak.map(({ r, i }) => (
                    <li key={i} className="text-[12.5px] text-slate-700 border border-red-200 bg-red-50/60 rounded-xl px-3 py-2.5">
                      <b className="text-red-500">{r.score}/5</b> — {track.qs[i]?.q}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/ai-tutor" className="mt-3 inline-block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-[12px] font-bold px-4 py-2.5 rounded-lg">
                Study these with the AI Tutor →
              </Link>
            </div>

            <div className="card p-5">
              <h3 className="font-bold text-[15px] text-[#101a3f] mb-2">ⓘ How scoring works</h3>
              <p className="text-[12.5px] text-slate-600 leading-relaxed">
                The AI grades each answer 0–5 for correctness and depth. If the AI is offline, the page falls back to a
                <b> keyword check</b> — how many of the question&apos;s key concepts appear in your answer — and labels it honestly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
