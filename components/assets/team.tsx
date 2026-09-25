"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const AFFILIATIONS = [
  { name: "Carnegie Mellon University", image: "cmu.svg", width: 246, height: 22 },
  { name: "Lossfunk", image: "lossfunk-white.png", width: 126, height: 55 },
  { name: "IIT Bombay", image: "iit-bombay-white.png", width: 44, height: 44, label: true },
  { name: "IIT Kanpur", image: "iit-kanpur-white.png", width: 284, height: 45 },
  { name: "Massachusetts Institute of Technology", image: "mit.svg", width: 188, height: 44 },
  { name: "Stanford", image: "stanford.png", width: 145, height: 31 },
  { name: "NVIDIA", image: "nvidia.svg", width: 147, height: 28 },
];

function AffiliationMarks({ duplicate = false }: { duplicate?: boolean }) {
  return <ul className={`affiliation-list${duplicate ? " affiliation-copy" : ""}`} aria-hidden={duplicate || undefined}>
    {AFFILIATIONS.map((brand) => <li key={brand.name} data-wide={brand.width > 200}>
      <Image src={`/brands/${brand.image}`} alt={duplicate || brand.label ? "" : brand.name} width={brand.width} height={brand.height} unoptimized />
      {brand.label ? <span className="affiliation-institute-name">{brand.name}</span> : null}
    </li>)}
  </ul>;
}

/** A scrollable list preserves the hero's height before motion is initialized. */
export function Team() {
  const section = useRef<HTMLElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let frame = 0;
    let inView = true;
    const syncPreference = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setMotionAllowed(media.matches));
    };
    const syncVisibility = () => { element.dataset.visible = String(inView && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncVisibility();
    });
    observer.observe(element);
    media.addEventListener("change", syncPreference);
    document.addEventListener("visibilitychange", syncVisibility);
    syncPreference();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener("change", syncPreference);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  return (
    <section ref={section} id="affiliations" className="hero-affiliations" data-motion={motionAllowed} aria-labelledby="affiliation-heading">
      <div className="site-container affiliation-inner">
        <div className="affiliation-intro">
          <h2 id="affiliation-heading">Built &amp; trusted by</h2>
          <p>Team &amp; advisor affiliations.</p>
        </div>
        <div className="affiliation-window">
          <div className="affiliation-track">
            <AffiliationMarks />
            <AffiliationMarks duplicate />
          </div>
        </div>
      </div>
    </section>
  );
}
