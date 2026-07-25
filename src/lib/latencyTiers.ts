export type SpeedTier = "fast" | "moderate" | "slow";

const FAST_THRESHOLD_MS = 50;
const MODERATE_THRESHOLD_MS = 300;

export function getSpeedTier(latencyMs: number): SpeedTier {
  if (latencyMs < FAST_THRESHOLD_MS) return "fast";
  if (latencyMs <= MODERATE_THRESHOLD_MS) return "moderate";
  return "slow";
}

export const TIER_COLOR: Record<SpeedTier, string> = {
  fast: "#22C55E",
  moderate: "#EAB308",
  slow: "#F97316",
};

export const TIER_LABEL: Record<SpeedTier, string> = {
  fast: "Fast",
  moderate: "Moderate",
  slow: "Slow · Bottleneck",
};

/** Pulse-animation duration in ms — faster hops pulse faster. */
export const TIER_ANIMATION_MS: Record<SpeedTier, number> = {
  fast: 350,
  moderate: 600,
  slow: 1000,
};

export const SLOW_NODE_THRESHOLD_MS = MODERATE_THRESHOLD_MS;
