import type { Edge, Node } from "@xyflow/react";
import { resolveEdge, type ServiceNodeData, type TraceEdgeData } from "./topology";
import type { ExecutionStep } from "./types";

export interface ReplayState {
  nodes: Node<ServiceNodeData>[];
  edges: Edge<TraceEdgeData>[];
}

/**
 * Reconstructs canvas state at a point in the execution log by folding every
 * step from index 0..uptoIndex onto the idle base topology — the same
 * status/edge-resolve rules `useTraceSocket`'s `recordStep` applies live.
 * Pure and deterministic, so scrubbing the timeline is just calling this
 * with a different `uptoIndex`; no separate history storage is needed
 * beyond the execution log that already exists.
 */
export function computeReplayState(
  baseNodes: Node<ServiceNodeData>[],
  baseEdges: Edge<TraceEdgeData>[],
  chronologicalSteps: ExecutionStep[],
  uptoIndex: number,
): ReplayState {
  const nodes = baseNodes.map((n) => ({
    ...n,
    data: { ...n.data, status: "idle" as const, lastStep: undefined, lastLatency: undefined, badgeLabel: undefined },
  }));
  const edges = baseEdges.map((e) => ({
    ...e,
    data: { status: "idle" as const, reversed: false, label: undefined, latencyMs: undefined },
  }));

  const nodeIndexById = new Map(nodes.map((n, i) => [n.id, i]));
  const edgeIndexById = new Map(edges.map((e, i) => [e.id, i]));

  const lastIndex = Math.min(uptoIndex, chronologicalSteps.length - 1);
  for (let i = 0; i <= lastIndex; i++) {
    const step = chronologicalSteps[i];
    const ni = nodeIndexById.get(step.toNode);
    if (ni !== undefined) {
      nodes[ni] = {
        ...nodes[ni],
        data: { ...nodes[ni].data, status: step.status, lastStep: step.stepName, lastLatency: step.latencyMs },
      };
    }

    const resolved = resolveEdge(step.fromNode, step.toNode, edges);
    if (resolved) {
      const ei = edgeIndexById.get(resolved.edgeId);
      if (ei !== undefined) {
        edges[ei] = {
          ...edges[ei],
          data: { status: step.status, reversed: resolved.reversed, latencyMs: step.latencyMs },
        };
      }
    }
  }

  return { nodes, edges };
}
