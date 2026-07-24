import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deployed on Vercel; no `output: 'standalone'` needed.
  // User-uploaded and catalog media are rendered with plain <img> from
  // short-lived Supabase signed URLs (which expire), so next/image
  // optimization and remotePatterns are intentionally not configured here.
};

export default nextConfig;
