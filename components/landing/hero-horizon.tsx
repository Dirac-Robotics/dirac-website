"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { SITE } from "@/lib/config/site";
import { MOTION_CONFIG } from "@/lib/config/motion";
import { Team } from "@/components/assets/team";
import { ButtonLabel } from "@/components/ui/button-label";

/** The source is a single image: motion always moves the whole composition. */
export function HeroHorizon() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = section.current;
    if (!element || MOTION_CONFIG.hero === "static") return;
    const allowed = window.matchMedia("(prefers-reduced-motion: no-preference) and (pointer: fine)");
    let visible = true;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const update = () => {
      frame = 0;
      if (!allowed.matches || !visible || document.hidden) return;
      const rect = element.getBoundingClientRect();
      const scroll = Math.max(-8, Math.min(8, -rect.top * 0.018));
      element.style.setProperty("--hero-x", `${pointerX * 5}px`);
      element.style.setProperty("--hero-y", `${pointerY * 3 + scroll}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
      schedule();
    };
    const reset = () => {
      pointerX = 0;
      pointerY = 0;
      element.style.removeProperty("--hero-x");
      element.style.removeProperty("--hero-y");
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(element);
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", schedule, { passive: true });
    allowed.addEventListener("change", reset);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      window.removeEventListener("scroll", schedule);
      allowed.removeEventListener("change", reset);
    };
  }, []);

  return (
    <section ref={section} className="hero-horizon" aria-labelledby="hero-title">
      <div className="hero-media">
        <Image
          src="/media/robot-horizon-v3.webp"
          alt="A small exploration robot beneath a luminous orange horizon"
          fill
          // Keep the supplied image's pixels intact: this WebP is already lossless.
          unoptimized
          preload
        />
      </div>
      <div className="hero-horizon-main">
        <div className="site-container hero-copy">
          <h1 id="hero-title" className="hero-title">
            <span>Reduce robot</span>{" "}
            <span>deployment time <span className="hero-impact">by 5×</span></span>{" "}
            <span className="hero-simulations">with simulations.</span>
          </h1>
          <div className="hero-actions">
            <a href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer" className="site-button hero-button hero-button-primary"><ButtonLabel>Get started</ButtonLabel><ArrowUpRight aria-hidden="true" /></a>
            <a href={SITE.bookingUrl} target="_blank" rel="noopener noreferrer" className="site-button hero-button hero-button-glass"><ButtonLabel>Book a call</ButtonLabel><ArrowUpRight aria-hidden="true" /></a>
          </div>
          <div className="hero-backers" aria-label="Backed by Entrepreneurs First and Transpose Platform">
            <span className="data">Backed by</span>
            <Image className="backer-ef" src="/brands/entrepreneur-first.svg" alt="Entrepreneurs First" width={190} height={14} unoptimized />
            <Image className="backer-transpose" src="/brands/transpose-platform.svg" alt="Transpose Platform" width={194} height={25} unoptimized />
          </div>
          <div className="hero-program" aria-label="Member of the NVIDIA Inception program">
            <span className="data">Member of</span>
            <Image src="/brands/nvidia-inception.png" alt="NVIDIA Inception program" width={180} height={64} unoptimized />
          </div>
        </div>
      </div>
      <Team />
    </section>
  );
}
