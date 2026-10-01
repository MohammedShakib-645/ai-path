// SEO sitemap (Phase 7 — Advanced).
import type { MetadataRoute } from "next";
import { ALL_LESSONS, LEVELS, PROJECTS } from "../lib/curriculum";

const BASE = "https://ai-path-tutor.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/learn", "/dashboard", "/practice", "/quizzes", "/progress", "/ai-tutor", "/interview", "/doubt", "/code-explainer", "/notes", "/planner", "/achievements", "/projects", "/settings"].map(
    (p) => ({ url: `${BASE}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }),
  );
  const lessons = ALL_LESSONS.slice(0, 40).map((x) => ({
    url: `${BASE}/lesson/${x.lesson.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  const courses = LEVELS.map((l) => ({
    url: `${BASE}/courses/${l.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const projects = PROJECTS.map((p) => ({
    url: `${BASE}/projects/${p.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...courses, ...lessons, ...projects];
}
