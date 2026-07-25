import type { Edge, Node } from "@xyflow/react";
import { buildDynamicTopology, parseCode, type DynamicTopology } from "./codeParser";
import type { IngestedFile } from "./zipIngest";
import type { ServiceNodeData, TraceEdgeData } from "./topology";
import type { SimHop } from "./simulate";

export interface FileGraphEntry {
  file: IngestedFile;
  topology: DynamicTopology | null;
}

export interface MultiFileResult {
  files: FileGraphEntry[];
  combined: DynamicTopology | null;
}

const BAND_GAP = 60;
const IMPORT_RE = /(?:import[^'"]*from\s*|require\(\s*)['"](\.[^'"]+)['"]/g;

function prefixTopology(topology: DynamicTopology, prefix: string, yOffset: number): DynamicTopology {
  const remapId = (id: string) => `${prefix}${id}`;
  return {
    nodes: topology.nodes.map((n) => ({
      ...n,
      id: remapId(n.id),
      position: { x: n.position.x, y: n.position.y + yOffset },
    })),
    edges: topology.edges.map((e) => ({
      ...e,
      id: `e-${remapId(e.source)}-${remapId(e.target)}`,
      source: remapId(e.source),
      target: remapId(e.target),
    })),
    hops: topology.hops.map((h) => ({ ...h, fromNode: remapId(h.fromNode), toNode: remapId(h.toNode) })),
  };
}

function topologyHeight(topology: DynamicTopology): number {
  if (topology.nodes.length === 0) return 300;
  const maxY = Math.max(...topology.nodes.map((n) => n.position.y));
  return maxY + 220;
}

/** Best-effort cross-file edges from relative `import`/`require` specifiers. */
function findImportEdges(files: IngestedFile[], fileRootIds: Map<string, string>): Edge<TraceEdgeData>[] {
  const edges: Edge<TraceEdgeData>[] = [];

  for (const file of files) {
    const fromRoot = fileRootIds.get(file.path);
    if (!fromRoot) continue;

    for (const m of file.content.matchAll(IMPORT_RE)) {
      const spec = m[1];
      const base = (spec.split("/").pop() ?? spec).replace(/\.(ts|tsx|js|jsx|py)$/, "");
      const target = files.find(
        (f) => f.path !== file.path && (f.path.split("/").pop() ?? "").replace(/\.(ts|tsx|js|jsx|py)$/, "") === base,
      );
      if (!target) continue;
      const toRoot = fileRootIds.get(target.path);
      if (!toRoot || toRoot === fromRoot) continue;

      const id = `e-import-${fromRoot}-${toRoot}`;
      if (edges.some((e) => e.id === id)) continue;
      edges.push({
        id,
        source: fromRoot,
        target: toRoot,
        type: "trace",
        data: { status: "idle", reversed: false, label: "imports" },
      });
    }
  }

  return edges;
}

/**
 * Parses each ingested file into its own mini graph (for the file-tree
 * canvas view), and merges all of them into one "combined" graph — each
 * file's nodes stacked in their own vertical band, with dashed edges drawn
 * between files that import one another.
 */
export function buildMultiFileGraphs(files: IngestedFile[]): MultiFileResult {
  const entries: FileGraphEntry[] = [];
  const combinedNodes: Node<ServiceNodeData>[] = [];
  const combinedEdges: Edge<TraceEdgeData>[] = [];
  const combinedHops: SimHop[] = [];
  const fileRootIds = new Map<string, string>();

  let yCursor = 0;
  files.forEach((file, index) => {
    const parsed = parseCode(file.content);
    const topology = buildDynamicTopology(parsed);
    entries.push({ file, topology });

    if (topology) {
      const prefix = `f${index}-`;
      const positioned = prefixTopology(topology, prefix, yCursor);
      combinedNodes.push(...positioned.nodes);
      combinedEdges.push(...positioned.edges);
      combinedHops.push(...positioned.hops);
      fileRootIds.set(file.path, `${prefix}client`);
      yCursor += topologyHeight(topology) + BAND_GAP;
    }
  });

  combinedEdges.push(...findImportEdges(files, fileRootIds));

  const combined: DynamicTopology | null =
    combinedNodes.length > 0 ? { nodes: combinedNodes, edges: combinedEdges, hops: combinedHops } : null;

  return { files: entries, combined };
}
