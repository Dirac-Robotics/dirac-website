"use client";

import { useEffect, useRef } from "react";
import { MOTION_CONFIG } from "@/lib/config/motion";

/** Decorative grid response; never hides or replaces the system pointer. */
export function GridIllumination() {
  const overlay = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = overlay.current;
    if (!element || MOTION_CONFIG.cursor === "standard") return;
    const allowed = window.matchMedia("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)");
    let frame = 0;
    let x = -100;
    let y = -100;
    const hide = () => { element.dataset.visible = "false"; };
    const move = (event: PointerEvent) => {
      if (!allowed.matches || document.hidden) return;
      x = event.clientX;
      y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        element.style.setProperty("--pointer-x", `${x}px`);
        element.style.setProperty("--pointer-y", `${y}px`);
        element.dataset.visible = "true";
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    document.addEventListener("visibilitychange", hide);
    allowed.addEventListener("change", hide);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      document.removeEventListener("visibilitychange", hide);
      allowed.removeEventListener("change", hide);
    };
  }, []);
  if (MOTION_CONFIG.cursor === "standard") return null;
  return <div ref={overlay} className="grid-illumination" data-mode={MOTION_CONFIG.cursor} aria-hidden="true" />;
}
