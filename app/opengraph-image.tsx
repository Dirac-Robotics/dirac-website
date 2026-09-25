import { ImageResponse } from "next/og";

import { SITE } from "@/lib/config/site";

// Social share image, generated at request time. Applies to every route via
// the Next.js file convention (og:image + twitter:image fallback).
export const alt = "Dirac Robotics, from robot to deployment";
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
          background: "#F5F3EE",
          color: "#17191D",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 16,
              height: 16,
              background: "#FF7900",
            }}
          />
          <div
            style={{
              fontSize: 30,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#535650",
            }}
          >
            {SITE.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700 }}>
            From robot to deployment.
          </div>
          <div style={{ fontSize: 32, color: "#535650", maxWidth: 900 }}>
            Model. Reconstruct. Train. Test. Improve.
          </div>
        </div>

        <div style={{ fontSize: 26, color: "#535650" }}>{SITE.domain}</div>
      </div>
    ),
    { ...size },
  );
}
