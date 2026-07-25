"use client";

import * as React from "react";

/**
 * Decorative background video for the hero only.
 *
 * The <video> is mounted from an effect rather than rendered on the server, so:
 *   - it never blocks first paint; the hero text is server-rendered and shows
 *     immediately regardless of video state,
 *   - under 768px and under prefers-reduced-motion the element never exists,
 *     which means the file is never requested (display:none would still fetch).
 * In both of those cases the poster still shows, painted as a background image
 * on the wrapper so a missing file degrades to flat black instead of a broken
 * image icon.
 */

const POSTER = "/hero-poster.jpg";
const SOURCES = [
  { src: "/hero.webm", type: "video/webm" },
  { src: "/hero.mp4", type: "video/mp4" },
];

export function HeroVideo() {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const small = window.matchMedia("(max-width: 767px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(!small.matches && !reduced.matches);
    sync();
    small.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      small.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 overflow-hidden bg-[var(--void)]"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${POSTER}")` }}
      />
      {enabled ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={POSTER}
          tabIndex={-1}
          className="absolute inset-0 size-full object-cover"
        >
          {SOURCES.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      ) : null}
      {/* Mandatory scrim. Sits between the footage and the hero text. */}
      <div className="hero-scrim absolute inset-0" />
    </div>
  );
}
