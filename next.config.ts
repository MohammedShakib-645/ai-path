import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // hide the floating "N" dev-tools badge
  devIndicators: false,
  // Required for the desktop .exe: produces .next/standalone server
  output: "standalone",
  // Phase 4: authored MDX lessons are first-class pages.
  pageExtensions: ["ts", "tsx", "mdx"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Learn merge: old routes permanently redirect (old URLs never break).
  async redirects() {
    return [
      { source: "/courses", destination: "/learn?view=catalog", permanent: true },
      { source: "/learning-path", destination: "/learn", permanent: true },
      { source: "/roadmap", destination: "/learn", permanent: true },
    ];
  },
};

const withMDX = createMDX({ extension: /\.mdx?$/ });

export default withMDX(nextConfig);
