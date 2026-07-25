import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` emits a self-contained server bundle (.next/standalone) for the
  // container image built in Docker/ACR. It is a no-op on Vercel.
  output: "standalone",
  // User-uploaded and catalog media are rendered with plain <img> from public
  // Azure Blob URLs, so next/image optimization and remotePatterns are
  // intentionally not configured here.
};

export default nextConfig;
