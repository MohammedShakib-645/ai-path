import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // hide the floating "N" dev-tools badge
  devIndicators: false,
  // Required for the desktop .exe: produces .next/standalone server
  output: "standalone",
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

export default nextConfig;
