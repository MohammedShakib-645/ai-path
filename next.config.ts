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
};

export default nextConfig;
