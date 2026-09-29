import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Required for the desktop .exe: produces .next/standalone server
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
