"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { TraceEdgeData } from "@/lib/topology";
import { getSpeedTier, TIER_ANIMATION_MS, TIER_COLOR } from "@/lib/latencyTiers";

const STATUS_COLORS: Record<string, string> = {
  running: "#3B82F6",
  success: "#22C55E",
  error: "#EF4444",
};

export default function TraceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps & { data?: TraceEdgeData }) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status ?? "idle";
  const reversed = data?.reversed ?? false;
  const isActive = status !== "idle";

  // Latency heatmap: color/animation speed reflect the hop's simulated
  // duration, except errors always render red regardless of how fast they failed.
  const tier = status !== "error" && typeof data?.latencyMs === "number" ? getSpeedTier(data.latencyMs) : null;
  const isBottleneck = tier === "slow";
  const color = status === "error" ? STATUS_COLORS.error : tier ? TIER_COLOR[tier] : STATUS_COLORS[status] ?? "#94A3B8";
  const animationMs = tier ? TIER_ANIMATION_MS[tier] : 600;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "#CBD5E1",
          strokeWidth: 2,
          strokeDasharray: "6 6",
        }}
      />
      {isActive && isBottleneck && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          className="animate-pulse"
          style={{ opacity: 0.35, filter: `blur(3px)` }}
        />
      )}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="8 8"
          className="animate-dash-flow"
          style={{
            animationDirection: reversed ? "reverse" : "normal",
            animationDuration: `${animationMs}ms`,
            filter: `drop-shadow(0 0 ${isBottleneck ? 8 : 5}px ${color})`,
          }}
        />
      )}
      {isActive && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${
                (sourceY + targetY) / 2 - 14
              }px)`,
              backgroundColor: color,
            }}
          >
            {data?.label ?? (typeof data?.latencyMs === "number" ? `${data.latencyMs}ms` : status)}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
