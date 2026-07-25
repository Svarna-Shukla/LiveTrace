import type { Edge, Node } from "@xyflow/react";
import type { NodeStatus } from "./types";

export type ServiceIcon = "globe" | "shield" | "key" | "database";

export interface ServiceNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  icon: ServiceIcon;
  status: NodeStatus;
  lastStep?: string;
  lastLatency?: number;
  badgeLabel?: string;
}

export interface TraceEdgeData extends Record<string, unknown> {
  status: NodeStatus;
  reversed: boolean;
  label?: string;
  latencyMs?: number;
}

export const initialNodes: Node<ServiceNodeData>[] = [
  {
    id: "webapp",
    type: "service",
    position: { x: 20, y: 240 },
    data: {
      label: "Web Client",
      subtitle: "Frontend · Next.js",
      icon: "globe",
      status: "idle",
    },
  },
  {
    id: "authapi",
    type: "service",
    position: { x: 420, y: 240 },
    data: {
      label: "Auth API",
      subtitle: "POST /api/auth/login",
      icon: "shield",
      status: "idle",
    },
  },
  {
    id: "envsecrets",
    type: "service",
    position: { x: 840, y: 40 },
    data: {
      label: ".env Secrets",
      subtitle: "JWT_SECRET · DB_URL",
      icon: "key",
      status: "idle",
    },
  },
  {
    id: "database",
    type: "service",
    position: { x: 840, y: 440 },
    data: {
      label: "Database",
      subtitle: "users table",
      icon: "database",
      status: "idle",
    },
  },
];

export const initialEdges: Edge<TraceEdgeData>[] = [
  {
    id: "e-webapp-authapi",
    source: "webapp",
    target: "authapi",
    type: "trace",
    data: { status: "idle", reversed: false },
  },
  {
    id: "e-authapi-envsecrets",
    source: "authapi",
    target: "envsecrets",
    type: "trace",
    data: { status: "idle", reversed: false },
  },
  {
    id: "e-authapi-database",
    source: "authapi",
    target: "database",
    type: "trace",
    data: { status: "idle", reversed: false },
  },
];

export interface ResolvedEdge {
  edgeId: string;
  reversed: boolean;
}

/**
 * A trace step's fromNode/toNode may point along an edge in either direction
 * (e.g. authapi->envsecrets for the request, envsecrets->authapi for the reply).
 * Both share a single visual edge; `reversed` tells the edge which way to animate.
 *
 * `edges` is the structural edge list of whichever topology is currently active
 * (built-in demo or a dynamically parsed graph) — callers must pass the live set.
 */
export function resolveEdge(
  fromNode: string,
  toNode: string,
  edges: Edge<TraceEdgeData>[],
): ResolvedEdge | null {
  const forwardId = `e-${fromNode}-${toNode}`;
  const reverseId = `e-${toNode}-${fromNode}`;
  if (edges.some((e) => e.id === forwardId)) {
    return { edgeId: forwardId, reversed: false };
  }
  if (edges.some((e) => e.id === reverseId)) {
    return { edgeId: reverseId, reversed: true };
  }
  return null;
}
