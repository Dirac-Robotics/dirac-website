/** Design-time alternatives. These are not visitor-facing settings. */
export type MotionConfig = {
  hero: "static" | "parallax";
  workflow: "scroll" | "tabs";
  reconstruction: "staged" | "slider";
  cursor: "standard" | "grid" | "halo";
};

export const MOTION_CONFIG: MotionConfig = {
  // Keep the full-screen photograph anchored when scrolling or crossing sections.
  hero: "static",
  workflow: "scroll",
  reconstruction: "staged",
  cursor: "grid",
};
