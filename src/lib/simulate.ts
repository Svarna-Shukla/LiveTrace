import type { Edge, Node } from "@xyflow/react";
import type { ServiceNodeData, TraceEdgeData } from "./topology";

export interface SimHop {
  fromNode: string;
  toNode: string;
  stepName: string;
  payload: Record<string, unknown>;
  latencyMs: number;
  outcome: "success" | "error";
  badgeLabel?: string;
  edgeLabel?: string;
}

/**
 * Graph-agnostic trace generator. Instead of hardcoding node IDs, this reads
 * whatever topology is currently on the canvas — the built-in demo or a
 * custom graph parsed from user code — finds its root node(s), and walks the
 * real edges to build a plausible sequence of hops. This is what lets the
 * "Simulate Request" toolbar work on any uploaded codebase.
 */

function findRootNodeIds(nodes: Node<ServiceNodeData>[], edges: Edge<TraceEdgeData>[]): string[] {
  const targets = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
  if (roots.length > 0) return roots;
  return nodes.length > 0 ? [nodes[0].id] : [];
}

function labelFor(nodes: Node<ServiceNodeData>[], id: string): string {
  return nodes.find((n) => n.id === id)?.data.label ?? id;
}

function slug(text: string): string {
  const cleaned = text
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  return cleaned || "NODE";
}

/**
 * Right-skewed random latency (double-uniform product): most hops land fast
 * or moderate, with an occasional slow outlier — similar to a real p50/p99
 * latency distribution. Spans all three heatmap tiers (<50ms / 50-300ms / >300ms).
 */
function randomLatencyMs(): number {
  return Math.round(20 + Math.random() * Math.random() * 480);
}

/** Breadth-first walk from the root(s), returning edges in visitation order. */
function traverseEdgesInOrder(
  nodes: Node<ServiceNodeData>[],
  edges: Edge<TraceEdgeData>[],
): Edge<TraceEdgeData>[] {
  const roots = findRootNodeIds(nodes, edges);
  const visited = new Set<string>(roots);
  const queue = [...roots];
  const ordered: Edge<TraceEdgeData>[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const outgoing = edges.filter((e) => e.source === current);
    for (const edge of outgoing) {
      ordered.push(edge);
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }

  return ordered;
}

/**
 * Builds a hop sequence for a "success" (everything resolves cleanly) or
 * "error" (mostly succeeds, then fails on the last hop reached) trace through
 * the currently active graph.
 */
export function buildDynamicHops(
  nodes: Node<ServiceNodeData>[],
  edges: Edge<TraceEdgeData>[],
  kind: "success" | "error",
): SimHop[] {
  const orderedEdges = traverseEdgesInOrder(nodes, edges);
  if (orderedEdges.length === 0) return [];

  const failIndex = kind === "error" ? orderedEdges.length - 1 : -1;

  return orderedEdges.map((edge, i) => {
    const isFail = i === failIndex;
    const targetLabel = labelFor(nodes, edge.target);
    return {
      fromNode: edge.source,
      toNode: edge.target,
      stepName: isFail ? "REQUEST_FAILED" : `CALL_${slug(targetLabel)}`,
      payload: isFail
        ? { status: 500, error: `${targetLabel} did not respond` }
        : { status: 200, target: targetLabel },
      latencyMs: randomLatencyMs(),
      outcome: isFail ? "error" : "success",
      badgeLabel: isFail ? "500 · Error" : "200 OK",
      edgeLabel: isFail ? "500" : "200",
    };
  });
}

/**
 * Right-skewed latency, but shifted upward as `rate` (requests/sec, 1-100)
 * rises — at rate=1 this matches `randomLatencyMs`'s mostly-fast/moderate
 * spread; at rate=100 nearly every hop clears the 300ms "slow" heatmap
 * threshold, visually showing the graph degrading under load.
 */
export function randomCongestedLatencyMs(rate: number): number {
  const congestion = Math.min(1, Math.max(0, (rate - 1) / 99));
  const base = 20 + Math.random() * Math.random() * 480;
  const congestionShift = congestion * (300 + Math.random() * 600);
  return Math.round(base + congestionShift);
}

/** One synthetic hop for the Load Test generator — like a spike burst, but its
 * error rate and latency both scale with the current requests/sec rate. */
export function buildLoadTestHop(
  nodes: Node<ServiceNodeData>[],
  edges: Edge<TraceEdgeData>[],
  rate: number,
  index: number,
): SimHop | null {
  if (edges.length === 0) return null;
  const edge = edges[Math.floor(Math.random() * edges.length)];
  const congestion = Math.min(1, Math.max(0, (rate - 1) / 99));
  const errorChance = 0.03 + congestion * 0.25;
  const outcome: "success" | "error" = Math.random() < errorChance ? "error" : "success";
  const targetLabel = labelFor(nodes, edge.target);
  return {
    fromNode: edge.source,
    toNode: edge.target,
    stepName: `${outcome === "success" ? "LOAD_REQ" : "LOAD_ERR"}_${index + 1}`,
    payload: { requestId: `load_${Date.now()}_${index}`, target: targetLabel, rate },
    latencyMs: randomCongestedLatencyMs(rate),
    outcome,
  };
}

/** One random burst hop for the "traffic spike" simulation, sampled from the live edge set. */
export function buildDynamicSpikeHop(
  nodes: Node<ServiceNodeData>[],
  edges: Edge<TraceEdgeData>[],
  index: number,
): SimHop | null {
  if (edges.length === 0) return null;
  const edge = edges[Math.floor(Math.random() * edges.length)];
  const outcome: "success" | "error" = Math.random() < 0.82 ? "success" : "error";
  const targetLabel = labelFor(nodes, edge.target);
  return {
    fromNode: edge.source,
    toNode: edge.target,
    stepName: `${outcome === "success" ? "REQUEST" : "ERROR"}_${index + 1}`,
    payload: { requestId: `req_${Date.now()}_${index}`, target: targetLabel },
    latencyMs: randomLatencyMs(),
    outcome,
  };
}
