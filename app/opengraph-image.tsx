import { ImageResponse } from "next/og";

import { SITE } from "@/lib/config/site";

// Social share image, generated at request time. Applies to every route via
// the Next.js file convention (og:image + twitter:image fallback).
export const alt = "Dirac Robotics — measured-physics simulation assets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#050508",
          color: "#f5f4f0",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 9999,
              background: "#cdcac2",
            }}
          />
          <div
            style={{
              fontSize: 30,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#8a8a8a",
            }}
          >
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700 }}>
            Measured-physics simulation assets.
          </div>
          <div style={{ fontSize: 32, color: "#b4b4b4", maxWidth: 900 }}>
            Physics-accurate Isaac Sim assets from real objects: measured mass,
            inertia, friction, and joint dynamics.
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#8a8a8a" }}>{SITE.domain}</div>
      </div>
    ),
    { ...size },
  );
}
