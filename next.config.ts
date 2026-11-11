import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Allow the sandbox preview host (and local addresses) to load dev assets,
  // otherwise React never hydrates inside the live preview iframe.
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.e2b.app",
    "*.vercel.app",
    "digitrans.ng",
  ],
};

export default nextConfig;
