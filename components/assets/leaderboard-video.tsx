"use client";

import * as React from "react";

/**
 * Ambient background video for the leaderboard. Gated to the client so it never
 * ships to phones: the 18MB clip is skipped on small screens and when Save-Data
 * is on. The dark overlay is rendered by the caller regardless, so the section
 * still reads well without it.
 */
export function LeaderboardVideo() {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    const bigEnough = window.matchMedia("(min-width: 640px)").matches;
    const conn = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const saveData = conn?.saveData === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time device-capability check on mount
    setEnabled(bigEnough && !saveData);
  }, []);

  if (!enabled) return null;

  return (
    <video
      className="absolute inset-0 -z-20 size-full object-cover opacity-60"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    >
      <source src="/background.mp4" type="video/mp4" />
    </video>
  );
}
