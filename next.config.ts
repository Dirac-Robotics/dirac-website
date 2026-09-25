import type { NextConfig } from "next";

// One year, immutable: the browser keeps these across visits without
// revalidating. Applied only to genuinely static public assets.
const IMMUTABLE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  // `standalone` emits a self-contained server bundle (.next/standalone) for the
  // container image built in Docker/ACR. It is a no-op on Vercel.
  output: "standalone",
  // Drop the framework fingerprint header.
  poweredByHeader: false,
  images: {
    qualities: [75, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3072, 3840, 4146],
  },
  async redirects() {
    return [
      { source: "/real2sim", destination: "/#how-it-works", permanent: true },
      { source: "/evals", destination: "/#stage-04", permanent: true },
      { source: "/deployments", destination: "/#stage-05", permanent: true },
      { source: "/about", destination: "/#affiliations", permanent: true },
      { source: "/contact", destination: "/#submit", permanent: true },
      { source: "/community-assets", destination: "/asset-pack", permanent: true },
      { source: "/requests", destination: "/asset-pack", permanent: true },
    ];
  },
  // User-uploaded and catalog media are rendered with plain <img> from public
  // Azure Blob URLs. The local hero uses next/image; remotePatterns are not
  // needed for the catalog or user-uploaded media.
  async headers() {
    return [
      {
        // 3D models are large and rarely change; cache them hard so repeat
        // visits skip the re-download. (Next already immutable-caches the
        // hashed /_next/static bundles and self-hosted fonts.)
        source: "/models/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/asset-pack/models/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/asset-pack/posters/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/asset-pack/tracks/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/asset-pack/basis/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
      {
        source: "/Logo.png",
        headers: [{ key: "Cache-Control", value: IMMUTABLE }],
      },
    ];
  },
};

export default nextConfig;
