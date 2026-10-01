// SEO robots (Phase 7 — Advanced).
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://ai-path-tutor.vercel.app/sitemap.xml",
  };
}
