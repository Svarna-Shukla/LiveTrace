import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Edge, Node } from "@xyflow/react";
import type { ServiceIcon, ServiceNodeData, TraceEdgeData } from "./topology";
import type { ExecutionStep } from "./types";

/**
 * Zero-backend share codec: the whole diagram snapshot is compressed into
 * the URL itself (?flow=...), nothing is persisted server-side.
 *
 * Privacy: only structural/display data is included — node names, category,
 * position, edges, and a sanitized execution log (step name/status/latency).
 * Raw source code, env var names, DB query text, and payloads never leave
 * the client and are never part of the shared payload.
 */

export interface SharedNode {
  id: string;
  x: number;
  y: number;
  label: string;
  icon: ServiceIcon;
}

export interface SharedEdge {
  id: string;
  source: string;
  target: string;
}

export interface SharedStep {
  from: string;
  to: string;
  step: string;
  status: "success" | "error";
  ms: number;
}

export interface SharedFlow {
  v: 1;
  nodes: SharedNode[];
  edges: SharedEdge[];
  steps: SharedStep[];
}

const CATEGORY_LABEL: Record<ServiceIcon, string> = {
  globe: "Client",
  shield: "API Route",
  key: "Environment",
  database: "Database",
};

export function categoryLabel(icon: ServiceIcon): string {
  return CATEGORY_LABEL[icon] ?? "Node";
}

const MAX_SHARED_STEPS = 20;

export function buildSharedFlow(
  nodes: Node<ServiceNodeData>[],
  edges: Edge<TraceEdgeData>[],
  log: ExecutionStep[],
): SharedFlow {
  return {
    v: 1,
    nodes: nodes.map((n) => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      label: n.data.label,
      icon: n.data.icon,
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    steps: log.slice(0, MAX_SHARED_STEPS).map((s) => ({
      from: s.fromNode,
      to: s.toNode,
      step: s.stepName,
      status: s.status === "error" ? "error" : "success",
      ms: s.latencyMs,
    })),
  };
}

export function encodeSharedFlow(flow: SharedFlow): string {
  return compressToEncodedURIComponent(JSON.stringify(flow));
}

export function decodeSharedFlow(encoded: string): SharedFlow | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const parsed = JSON.parse(json) as Partial<SharedFlow>;
    if (parsed?.v !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) return null;
    return {
      v: 1,
      nodes: parsed.nodes,
      edges: parsed.edges,
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    };
  } catch {
    return null;
  }
}
