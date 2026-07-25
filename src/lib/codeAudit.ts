import type { Node } from "@xyflow/react";
import { parseCode, type ParsedRoute } from "./codeParser";
import { getSpeedTier, type SpeedTier } from "./latencyTiers";
import type { ServiceNodeData } from "./topology";
import type { NodeActivityEntry } from "./types";

/**
 * Deterministic, regex-based static analyzer — same "lightweight, not a real
 * AST" philosophy as codeParser.ts. Runs entirely client-side on whatever
 * source was last ingested, no external AI/LLM call involved.
 */

export type AuditSeverity = "critical" | "warning" | "optimization";
export type AuditCategory = "logic" | "security" | "performance";

export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  description: string;
  recommendation: string;
}

export interface LatencyRow {
  id: string;
  label: string;
  latencyMs: number | null;
  tier: SpeedTier | null;
}

export interface AuditReport {
  findings: AuditFinding[];
  healthScore: number;
  latencyRows: LatencyRow[];
  hasSource: boolean;
}

const HARDCODED_SECRET_RE =
  /\b(?:const|let|var)\s+(\w*(?:key|secret|token|password|apikey|api_key)\w*)\s*=\s*["'`]([A-Za-z0-9_\-.]{10,})["'`]/gi;

function findHardcodedSecrets(source: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const m of source.matchAll(HARDCODED_SECRET_RE)) {
    const varName = m[1];
    const value = m[2];
    const masked = `${value.slice(0, 4)}${"*".repeat(Math.max(0, value.length - 4))}`;
    findings.push({
      id: `secret-${varName}-${m.index}`,
      severity: "critical",
      category: "security",
      title: `Hardcoded secret: ${varName}`,
      description: `"${varName}" is assigned a literal string ("${masked}") instead of being read from environment variables — this would leak into source control.`,
      recommendation: `Read this from process.env.${varName.replace(/[a-z]/g, (c) => c.toUpperCase())} (or your secrets manager) instead of hardcoding it.`,
    });
  }
  return findings;
}

function findUnvalidatedEnvAccess(source: string, envVars: string[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  for (const name of envVars) {
    const re = new RegExp(`process\\.env\\.${name}\\b|os\\.(?:environ(?:\\.get)?|getenv)\\(["']${name}["']`, "g");
    let guarded = false;
    for (const m of source.matchAll(re)) {
      const idx = m.index ?? 0;
      const around = source.slice(Math.max(0, idx - 120), Math.min(source.length, idx + 120));
      if (/if\s*\(\s*!|(\?\?)|(\|\|)|throw/.test(around)) guarded = true;
    }
    if (!guarded) {
      findings.push({
        id: `env-${name}`,
        severity: "warning",
        category: "security",
        title: `Unvalidated env access: ${name}`,
        description: `${name} is read with no null-check, default value, or startup validation — if it's unset, this silently becomes undefined at runtime.`,
        recommendation: `Validate required env vars at startup (throw if missing), or provide a fallback like ${name} ?? '<default>'.`,
      });
    }
  }
  return findings;
}

function findMissingErrorHandling(source: string): AuditFinding[] {
  const awaitCount = [...source.matchAll(/\bawait\s+/g)].length;
  if (awaitCount === 0) return [];
  const hasTryCatch = /\btry\s*\{/.test(source) && /\bcatch\s*\(/.test(source);
  const hasCatchChain = /\.catch\s*\(/.test(source);
  if (hasTryCatch || hasCatchChain) return [];
  return [
    {
      id: "missing-error-handling",
      severity: "warning",
      category: "logic",
      title: "No error handling around async operations",
      description: `Found ${awaitCount} await expression(s) with no try/catch block or .catch() handler anywhere in this code — a rejected promise here is unhandled.`,
      recommendation: "Wrap async route handlers in try/catch and return a proper error response on failure.",
    },
  ];
}

function findUnhandledThen(source: string): AuditFinding[] {
  for (const m of source.matchAll(/\.then\s*\(/g)) {
    const idx = m.index ?? 0;
    const after = source.slice(idx, idx + 200);
    if (!after.includes(".catch(")) {
      return [
        {
          id: `unhandled-then-${idx}`,
          severity: "warning",
          category: "logic",
          title: "Promise chain without .catch()",
          description: "A .then() chain was found without a nearby .catch() — a rejection here won't be handled.",
          recommendation: "Add a .catch() handler, or switch to async/await inside a try/catch block.",
        },
      ];
    }
  }
  return [];
}

function findSequentialQueries(routes: ParsedRoute[]): AuditFinding[] {
  return routes
    .filter((r) => r.dbCalls.length >= 2)
    .map((r) => ({
      id: `seq-db-${r.method}-${r.path}`,
      severity: "optimization" as const,
      category: "performance" as const,
      title: `Sequential database calls in ${r.method} ${r.path}`,
      description: `${r.dbCalls.length} database calls were detected in this route (${r.dbCalls.join(", ")}). Running them one after another adds unnecessary latency if they don't depend on each other.`,
      recommendation: "If these queries are independent, run them concurrently with Promise.all([...]).",
    }));
}

function findLatencyBottlenecks(rows: LatencyRow[]): AuditFinding[] {
  return rows
    .filter((r) => r.tier === "slow")
    .map((r) => ({
      id: `latency-${r.id}`,
      severity: "optimization" as const,
      category: "performance" as const,
      title: `${r.label} is a latency bottleneck`,
      description: `Last observed latency was ${r.latencyMs}ms, above the 300ms threshold.`,
      recommendation: "Profile this node for slow queries, missing indexes, or blocking I/O; consider caching or batching.",
    }));
}

function computeHealthScore(findings: AuditFinding[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === "critical") score -= 15;
    else if (f.severity === "warning") score -= 7;
    else score -= 3;
  }
  return Math.max(0, Math.min(100, score));
}

export function runCodeAudit(
  sourceCode: string | null,
  nodes: Node<ServiceNodeData>[],
  nodeActivity: Record<string, NodeActivityEntry[]>,
): AuditReport {
  const findings: AuditFinding[] = [];
  const hasSource = Boolean(sourceCode && sourceCode.trim());

  if (sourceCode && hasSource) {
    const parsed = parseCode(sourceCode);
    findings.push(...findHardcodedSecrets(sourceCode));
    findings.push(...findUnvalidatedEnvAccess(sourceCode, parsed.envVars));
    findings.push(...findMissingErrorHandling(sourceCode));
    findings.push(...findUnhandledThen(sourceCode));
    findings.push(...findSequentialQueries(parsed.routes));
  }

  const latencyRows: LatencyRow[] = nodes.map((n) => {
    const latest = nodeActivity[n.id]?.[0];
    const latencyMs = typeof latest?.latencyMs === "number" ? latest.latencyMs : null;
    return {
      id: n.id,
      label: n.data.label,
      latencyMs,
      tier: latencyMs !== null ? getSpeedTier(latencyMs) : null,
    };
  });
  findings.push(...findLatencyBottlenecks(latencyRows));

  return {
    findings,
    healthScore: computeHealthScore(findings),
    latencyRows,
    hasSource,
  };
}
