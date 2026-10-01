"use client";
import { useEffect } from "react";

// Manual "use my own API key" support (Settings → AI Engine).
// Keys live ONLY in this browser's localStorage and are attached to /api/*
// requests as x-user-groq / x-user-gemini headers. Server prefers them for
// that request only — never stored, never sent to anyone else.
export default function KeyInjector() {
  useEffect(() => {
    const w = window as Window & { __keyInjector?: boolean };
    if (w.__keyInjector) return;
    w.__keyInjector = true;
    const orig = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      try {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.href;
        if (url.startsWith("/api/")) {
          const raw = localStorage.getItem("ai-path-my-keys");
          if (raw) {
            const k = JSON.parse(raw);
            const h = new Headers(
              init?.headers || (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined)
            );
            if (k.groq) h.set("x-user-groq", k.groq);
            if (k.gemini) h.set("x-user-gemini", k.gemini);
            init = { ...(init || {}), headers: h };
          }
        }
      } catch { /* never break the request */ }
      return orig(input, init);
    };
  }, []);
  return null;
}
