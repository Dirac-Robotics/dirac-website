export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

/** Every visible state is derived from scroll position. No clocks or accumulated deltas. */
export function sampleTimeline(position: number, reducedMotion = false) {
  const bounded = clamp(position, 0, 4.999);
  const stage = Math.min(4, Math.floor(bounded));
  const progress = bounded - stage;
  const site = reducedMotion ? Number(stage > 0) : smooth((bounded - 0.78) / 0.38);
  const activity = reducedMotion ? Number(stage >= 2) : smooth((bounded - 1.78) / 0.28);
  return {
    stage,
    progress,
    site,
    activity,
    orbit: reducedMotion ? 0 : Math.sin(clamp(bounded, 0, 4) * Math.PI * 0.5) * 0.18,
    cycle: reducedMotion ? 0.48 : 0.03 + clamp((bounded - 2) / 0.92) * 0.79,
    evaluation: stage < 3 ? 0 : stage > 3 || reducedMotion ? 1 : clamp(progress / 0.85),
    improvement: stage < 4 ? 0 : reducedMotion ? 1 : clamp((bounded - 4) / 0.88),
  };
}
export type ScrollFrame = ReturnType<typeof sampleTimeline>;
