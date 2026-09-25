"use client";

import { useLayoutEffect, useRef } from "react";

const SESSION_KEY = "dirac-hero-intro-seen";

/** A brief first-visit reveal; navigation and input always take priority. */
export function HeroIntro() {
  const intro = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = intro.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === "true"; } catch { /* Storage is optional. */ }
    if (seen || motion.matches || document.hidden || window.scrollY > 12 || window.location.hash) return;

    const events = new AbortController();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      element.dataset.state = "complete";
      try { sessionStorage.setItem(SESSION_KEY, "true"); } catch { /* Storage is optional. */ }
    };
    element.dataset.state = "playing";
    const timeout = window.setTimeout(finish, 1400);
    const options = { signal: events.signal, passive: true };
    window.addEventListener("pointerdown", finish, options);
    window.addEventListener("keydown", finish, options);
    window.addEventListener("scroll", finish, options);
    window.addEventListener("resize", finish, options);
    document.addEventListener("focusin", finish, options);
    document.addEventListener("visibilitychange", finish, options);
    motion.addEventListener("change", finish, options);

    return () => {
      window.clearTimeout(timeout);
      events.abort();
      element.dataset.state = "idle";
    };
  }, []);

  return (
    <div ref={intro} className="hero-intro" data-state="idle" aria-hidden="true">
      <div className="hero-intro-lockup">
        {/* The transparent mark is extracted from the original Dirac artwork. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brands/dirac-mark.png" width="792" height="578" alt="" className="hero-intro-mark" />
        <span className="hero-intro-name">Dirac Robotics</span>
      </div>
    </div>
  );
}
