export const STORY_STAGES = [
  { short: "Robot", title: "Create your URDFs.", description: "Geometry, joints, and physics. Your robot, ready for simulation." },
  { short: "Site", title: "Recreate your site.", description: "A physics-accurate environment, with your robot already inside." },
  { short: "Train", title: "Train where it matters.", description: "Learn the task. Explore variations. Build a failure corpus." },
  { short: "Evaluate", title: "Test before rollout.", description: "Find failures in simulation, before they reach your floor." },
  { short: "Improve", title: "Improve with every deployment.", description: "Replay field failures. Refine the model. Catch regressions." },
] as const;

export const EVALUATIONS = [
  { scenario: "Pick + place", result: "Pass" },
  { scenario: "Obstacle clearance", result: "Pass" },
  { scenario: "Occluded target", result: "Fail" },
] as const;

export const EXAMPLE_SUCCESS_RATES = [95, 97, 98, 99, 100] as const;
export const EXAMPLE_DAYS = [1, 2, 3, 5, 7] as const;
