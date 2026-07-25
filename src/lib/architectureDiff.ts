import type { Node } from "@xyflow/react";
import { parseCode } from "./codeParser";
import type { IngestedFile } from "./ingestFilters";
import type { ServiceIcon } from "./topology";

export type DiffStatus = "added" | "removed" | "modified" | "unchanged";

export interface DiffNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  status: DiffStatus;
  icon: ServiceIcon;
  detail: string;
}

export interface DiffSummary {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export interface ArchitectureDiffResult {
  nodes: Node<DiffNodeData>[];
  summary: DiffSummary;
}

interface RouteRecord {
  method: string;
  path: string;
  file: string;
  icon: ServiceIcon;
  envVars: string[];
  dbCalls: string[];
}

/**
 * Collects every parsed route/fetch signature across a file set, keyed by
 * `"METHOD path"`. Uses the same best-effort `parseCode` regex scanner
 * `codeParser.ts` already uses for the live topology — diffing at this
 * signature level (not raw node IDs) is what makes comparison meaningful
 * across two independently-parsed uploads.
 */
function collectRoutes(files: IngestedFile[]): Map<string, RouteRecord> {
  const map = new Map<string, RouteRecord>();
  for (const file of files) {
    const parsed = parseCode(file.content);
    for (const route of parsed.routes) {
      if (route.method === "FN") continue; // synthetic fallback, not a real signature to diff
      const key = `${route.method} ${route.path}`;
      map.set(key, {
        method: route.method,
        path: route.path,
        file: file.path,
        icon: route.kind === "fetch" ? "globe" : "shield",
        envVars: route.envVars,
        dbCalls: route.dbCalls,
      });
    }
  }
  return map;
}

function sameList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((v, i) => v === sortedB[i]);
}

function describeChange(before: RouteRecord, after: RouteRecord): string {
  const parts: string[] = [];
  const addedEnv = after.envVars.filter((v) => !before.envVars.includes(v));
  const removedEnv = before.envVars.filter((v) => !after.envVars.includes(v));
  const addedDb = after.dbCalls.filter((v) => !before.dbCalls.includes(v));
  const removedDb = before.dbCalls.filter((v) => !after.dbCalls.includes(v));
  if (addedEnv.length) parts.push(`+env ${addedEnv.join(", ")}`);
  if (removedEnv.length) parts.push(`-env ${removedEnv.join(", ")}`);
  if (addedDb.length) parts.push(`+db ${addedDb.join(", ")}`);
  if (removedDb.length) parts.push(`-db ${removedDb.join(", ")}`);
  return parts.length > 0 ? parts.join(" · ") : "Logic changed";
}

/**
 * Diffs two ingested file sets (single files, .zip contents, or whole
 * folders — anything `ingestAnyFiles` produces) at the route/endpoint level
 * and returns one row per union'd signature, classified added/removed/
 * modified/unchanged. Deliberately not a full AST diff — same "lightweight,
 * regex-based, best-effort" philosophy as the rest of the parser.
 */
export function computeArchitectureDiff(beforeFiles: IngestedFile[], afterFiles: IngestedFile[]): ArchitectureDiffResult {
  const before = collectRoutes(beforeFiles);
  const after = collectRoutes(afterFiles);
  const keys = Array.from(new Set([...before.keys(), ...after.keys()])).sort();

  const summary: DiffSummary = { added: 0, removed: 0, modified: 0, unchanged: 0 };
  const nodes: Node<DiffNodeData>[] = keys.map((key, i) => {
    const b = before.get(key);
    const a = after.get(key);

    let status: DiffStatus;
    let detail: string;
    if (a && !b) {
      status = "added";
      detail = `New in ${a.file}`;
    } else if (b && !a) {
      status = "removed";
      detail = `Removed (was in ${b.file})`;
    } else if (a && b && !(sameList(a.envVars, b.envVars) && sameList(a.dbCalls, b.dbCalls))) {
      status = "modified";
      detail = describeChange(b, a);
    } else {
      status = "unchanged";
      detail = "No changes detected";
    }
    summary[status]++;

    const record = a ?? (b as RouteRecord);
    return {
      id: `diff-${i}`,
      type: "diff",
      position: { x: 40, y: i * 96 + 20 },
      data: { label: key, subtitle: record.file, status, icon: record.icon, detail },
    };
  });

  return { nodes, summary };
}
