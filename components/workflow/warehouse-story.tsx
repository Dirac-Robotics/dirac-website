"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowDown, Check, X } from "lucide-react";
import { EVALUATIONS, EXAMPLE_DAYS, EXAMPLE_SUCCESS_RATES, STORY_STAGES } from "./story-data";
import { clamp, sampleTimeline } from "./scroll-timeline";
import styles from "./warehouse-story.module.css";

const Workcell3D = dynamic(() => import("./workcell-3d"), { ssr: false, loading: () => <ScenePlaceholder /> });
const noopSubscribe = () => () => {};
const hydrated = () => true;
const onServer = () => false;
function useReducedMotion() {
  const subscribe = useCallback((callback: () => void) => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  }, []);
  return useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, onServer);
}
function ScenePlaceholder({ unavailable = false }: { unavailable?: boolean }) {
  return <div className={styles.placeholder}><span aria-hidden="true">D↗</span><p>{unavailable ? "3D preview unavailable" : "Loading your simulation"}</p></div>;
}
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ScenePlaceholder unavailable /> : this.props.children; }
}

function PerformanceChart({ progress }: { progress: number }) {
  const points = [[54, 240], [136, 155], [218, 112], [382, 69], [546, 26]];
  const path = "M54 240L136 155L218 112L382 69L546 26";
  const reveal = progress * 4;
  const index = Math.min(3, Math.floor(reveal));
  const fraction = reveal - index;
  const rate = EXAMPLE_SUCCESS_RATES[index] + (EXAMPLE_SUCCESS_RATES[index + 1] - EXAMPLE_SUCCESS_RATES[index]) * fraction;
  const lengths = points.map(([x, y], i) => i ? Math.hypot(x - points[i - 1][0], y - points[i - 1][1]) : 0);
  const drawn = (lengths.slice(0, index + 1).reduce((sum, n) => sum + n, 0) + lengths[index + 1] * fraction) / lengths.reduce((sum, n) => sum + n, 0);
  return <div className={styles.performance}>
    <div className={styles.chartMetric}><strong>{Number(rate.toFixed(1))}<span>%</span></strong><span>Task success</span></div>
    <svg viewBox="0 0 600 290" role="img" aria-label="Illustrative task success rises from 95 to 100 percent over a week.">
      {[26,112,240].map((y,i) => <g key={y}><path d={`M45 ${y}H570`} stroke="var(--border)" strokeDasharray="3 6"/><text x="32" y={y+4} textAnchor="end">{[100,98,95][i]}%</text></g>)}
      <path d={path} fill="none" stroke="var(--border)" strokeWidth="2"/>
      <path d={path} pathLength="1" strokeDasharray="1" strokeDashoffset={1-drawn} fill="none" stroke="var(--orange)" strokeWidth="3"/>
      {points.map(([x,y],i) => <g key={x}><text x={x} y="276" textAnchor="middle">Day {EXAMPLE_DAYS[i]}</text><g opacity={clamp((reveal-i)*4+1)}><circle cx={x} cy={y} r="5" fill="var(--background)" stroke="var(--orange)" strokeWidth="2"/></g></g>)}
    </svg>
    <p>Illustrative week, not measured results.</p>
  </div>;
}
function EvaluationPanel({ progress }: { progress: number }) {
  return <div className={styles.evaluation} aria-label="Illustrative site evaluation">
    {EVALUATIONS.map((item,index) => <div key={item.scenario} className={styles.checkRow} style={{opacity:0.28+0.72*clamp(progress*3-index+0.2)}}>
      <span>{item.scenario}</span><span className={item.result === "Pass" ? styles.pass : styles.fail}>{item.result === "Pass" ? <Check size={14} aria-hidden="true"/> : <X size={14} aria-hidden="true"/>}{item.result}</span>
    </div>)}
  </div>;
}

export function WarehouseStory() {
  const [position, setPosition] = useState(0);
  const [nearby, setNearby] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const enhanced = useSyncExternalStore(noopSubscribe, hydrated, onServer);
  const reducedMotion = useReducedMotion();
  const frame = sampleTimeline(position, reducedMotion);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let scheduled = 0;
    const read = () => {
      scheduled = 0;
      const distance = element.offsetHeight - (pin.current?.offsetHeight ?? window.innerHeight);
      const next = clamp(-element.getBoundingClientRect().top / Math.max(1,distance)) * 4.999;
      setPosition(previous => Math.abs(previous-next) > 0.0001 ? next : previous);
    };
    const queue = () => { if (!scheduled && !document.hidden) scheduled = requestAnimationFrame(read); };
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNearby(true); observer.disconnect(); } }, {rootMargin:"600px"});
    observer.observe(element);
    const resize = new ResizeObserver(queue);
    resize.observe(element);
    window.addEventListener("scroll",queue,{passive:true});
    window.addEventListener("resize",queue);
    document.addEventListener("visibilitychange",queue);
    queue();
    return () => { cancelAnimationFrame(scheduled); observer.disconnect(); resize.disconnect(); window.removeEventListener("scroll",queue); window.removeEventListener("resize",queue); document.removeEventListener("visibilitychange",queue); };
  }, []);

  const seek = useCallback((index: number, smooth = true) => {
    const element = track.current;
    if (!element) return;
    const distance = element.offsetHeight - (pin.current?.offsetHeight ?? window.innerHeight);
    const top = window.scrollY + element.getBoundingClientRect().top + distance * ((index+0.15)/4.999);
    window.scrollTo({top,behavior:smooth && !reducedMotion ? "smooth" : "instant"});
  }, [reducedMotion]);
  useEffect(() => {
    const followHash = () => { const match = /^#stage-0([1-5])$/.exec(window.location.hash); if (match) seek(Number(match[1])-1,false); };
    const frame = requestAnimationFrame(followHash);
    window.addEventListener("hashchange",followHash);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange",followHash); };
  }, [seek]);

  return <section id="how-it-works" className={styles.section} data-enhanced={enhanced} aria-labelledby="workflow-title">
    <div className={styles.intro}>
      <p className={styles.eyebrow}>Teleoperation</p>
      <h2 id="workflow-title">Accelerate your<br/><em>robot rollouts.</em></h2>
      <p className={styles.introDescription}>Site-specific simulations adapted to your teleoperation data.</p>
    </div>
    <div ref={track} className={styles.track}>
      <div ref={pin} className={styles.pin}>
        <div className={styles.layout}>
          <div className={styles.copy}>
            {STORY_STAGES.map((item,index) => <article key={item.short} id={`stage-0${index+1}`} className={styles.chapter} data-active={frame.stage === index} aria-hidden={enhanced && frame.stage !== index ? true : undefined}>
              <p className={styles.eyebrow}>0{index+1} / {item.short}</p><h3>{item.title}</h3><p className={styles.description}>{item.description}</p>
            </article>)}
          </div>
          <div className={styles.scene} data-stage={frame.stage}>
            <div className={styles.canvas} style={{opacity:reducedMotion ? (frame.stage === 4 ? 0.04 : 1) : 1-clamp((position-3.7)/0.3)*0.96}}><SceneBoundary>{nearby ? <Workcell3D position={position} reducedMotion={reducedMotion}/> : <ScenePlaceholder/>}</SceneBoundary></div>
            {frame.stage === 3 && <EvaluationPanel progress={frame.evaluation}/>}
            {frame.stage === 4 && <PerformanceChart progress={frame.improvement}/>}
            <span className={styles.illustration}>Illustrative simulation</span>
          </div>
        </div>
        <div className={styles.foot}>
          <span className={styles.scrollHint}>Scroll to explore <ArrowDown size={13} aria-hidden="true"/></span>
          <nav className={styles.navigation} aria-label="Simulation chapters">{STORY_STAGES.map((item,index) => <a key={item.short} href={`#stage-0${index+1}`} aria-current={frame.stage === index ? "step" : undefined} onClick={event => {event.preventDefault();window.history.replaceState(null,"",`#stage-0${index+1}`);seek(index);}}><span>0{index+1}</span>{item.short}<i aria-hidden="true" style={{transform:`scaleX(${clamp(position-index)})`}}/></a>)}</nav>
        </div>
      </div>
    </div>
  </section>;
}
