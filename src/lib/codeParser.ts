import type { Edge, Node } from "@xyflow/react";
import type { ServiceNodeData, TraceEdgeData } from "./topology";
import type { SimHop } from "./simulate";

/**
 * Lightweight regex-based code scanner — not a real AST parser. It looks for a
 * handful of common backend patterns (route declarations, env var access, DB
 * calls) across JS/TS and Python-ish syntax, and turns whatever it finds into
 * a React Flow graph + a sequence of simulation hops. Best-effort by design.
 */

const EXPRESS_ROUTE_RE = /(?<!@\w*)\b(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\2/gi;
const NEXT_HANDLER_RE = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;
const FASTAPI_ROUTE_RE = /@\w+\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/gi;
const FETCH_RE = /\bfetch\s*\(\s*(['"`])([^'"`]+)\1(?:\s*,\s*\{[^}]*?\bmethod\s*:\s*(['"`])(\w+)\3)?/gi;
const AXIOS_RE = /\baxios\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\2/gi;

const ENV_PATTERNS: RegExp[] = [
  /\bprocess\.env\.([A-Z0-9_]+)/g,
  /\bprocess\.env\[\s*["']([A-Z0-9_]+)["']\s*\]/g,
  /\bos\.(?:environ(?:\.get)?|getenv)\s*\(\s*["']([A-Z0-9_]+)["']/g,
  /\bos\.environ\[\s*["']([A-Z0-9_]+)["']\s*\]/g,
  /\bimport\.meta\.env\.([A-Z0-9_]+)/g,
  /\bimport\.meta\.env\[\s*["']([A-Z0-9_]+)["']\s*\]/g,
];

const DB_CALL_RE =
  /\b(?:db|prisma(?:\.\w+)?|knex|mongoose(?:\.\w+)?|pool|connection|conn|session|sequelize(?:\.\w+)?|db_session|orm)\.(query|execute|findUnique|findMany|findFirst|find|create|update|delete|save|insert|select|all|first)\s*\(/g;
const RAW_SQL_RE = /\b(SELECT\s+.+?\s+FROM\s+\w+|INSERT\s+INTO\s+\w+|UPDATE\s+\w+\s+SET|DELETE\s+FROM\s+\w+)\b/gi;

// Error-condition detection — same "best-effort regex, not AST" philosophy as
// the rest of this file. Looks for explicit HTTP status codes (JS/TS and
// Python-ish) to drive per-route error scenario buttons, plus a coarse
// try/catch-around-a-DB-call heuristic for "DB Timeout" scenarios when no
// explicit status code covers that case.
const STATUS_PATTERNS: RegExp[] = [
  /\.status\s*\(\s*(\d{3})\s*\)/g,
  /\bstatus\s*:\s*(\d{3})\b/g,
  /\bstatus_code\s*=\s*(\d{3})/gi,
];

const STATUS_LABELS: Record<number, string> = {
  400: "Bad Request",
  401: "Auth Failure",
  403: "Forbidden",
  404: "Not Found",
  408: "Timeout",
  409: "Conflict",
  422: "Validation Error",
  429: "Rate Limited",
  500: "Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Timeout",
};

function labelForStatus(code: number): string {
  return STATUS_LABELS[code] ?? `Error ${code}`;
}

function hasTryCatch(slice: string): boolean {
  return /\btry\b/.test(slice) && /\bcatch\b/.test(slice);
}

// Coarse presence checks for the sidebar's Diagram/Code badge — deliberately
// broader than the route/env/db regexes above (e.g. bare `router.` or lone
// `axios` usage), so a file is flagged flowchart-ready whenever it contains
// any of the target signatures, even if the graph builder can't turn it into
// a full route/hop.
const RELEVANCE_PATTERNS: RegExp[] = [
  /\bfetch\s*\(/,
  /\baxios\b/i,
  /\bapp\.(get|post|put|patch|delete)\s*\(/i,
  /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/,
  /\brouter\./,
  /\bprocess\.env\b/,
  /\bos\.environ\b/,
  /\bimport\.meta\.env\b/,
  /\bprisma\./,
  /\bdb\./,
  /\bSELECT\b/,
  /\bINSERT\b/,
  /\bmongoose\./,
  /\bsequelize\b/i,
];

/** Does this file contain at least one API/env/DB signature worth diagramming? */
export function isFlowchartReady(source: string): boolean {
  return RELEVANCE_PATTERNS.some((re) => re.test(source));
}

interface RawRouteMatch {
  method: string;
  path: string;
  index: number;
  kind: "route" | "fetch";
}

function uniq(values: string[]): string[] {
  return Array.from(new Set(values));
}

function findRoutes(source: string): RawRouteMatch[] {
  const matches: RawRouteMatch[] = [];

  for (const m of source.matchAll(EXPRESS_ROUTE_RE)) {
    matches.push({ method: m[1].toUpperCase(), path: m[3], index: m.index ?? 0, kind: "route" });
  }
  for (const m of source.matchAll(FASTAPI_ROUTE_RE)) {
    matches.push({ method: m[1].toUpperCase(), path: m[2], index: m.index ?? 0, kind: "route" });
  }
  for (const m of source.matchAll(NEXT_HANDLER_RE)) {
    matches.push({ method: m[1].toUpperCase(), path: "/", index: m.index ?? 0, kind: "route" });
  }
  for (const m of source.matchAll(FETCH_RE)) {
    const method = m[4] ? m[4].toUpperCase() : "GET";
    matches.push({ method, path: m[2], index: m.index ?? 0, kind: "fetch" });
  }
  for (const m of source.matchAll(AXIOS_RE)) {
    matches.push({ method: m[1].toUpperCase(), path: m[3], index: m.index ?? 0, kind: "fetch" });
  }

  return matches.sort((a, b) => a.index - b.index);
}

function findEnvVars(source: string): { name: string; index: number }[] {
  const found: { name: string; index: number }[] = [];
  for (const re of ENV_PATTERNS) {
    for (const m of source.matchAll(re)) {
      found.push({ name: m[1], index: m.index ?? 0 });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

function findDbCalls(source: string): { expr: string; index: number }[] {
  const found: { expr: string; index: number }[] = [];
  for (const m of source.matchAll(DB_CALL_RE)) {
    found.push({ expr: `${m[0].replace(/\s+/g, "")})`, index: m.index ?? 0 });
  }
  for (const m of source.matchAll(RAW_SQL_RE)) {
    found.push({ expr: m[1].toUpperCase().replace(/\s+/g, " "), index: m.index ?? 0 });
  }
  return found.sort((a, b) => a.index - b.index);
}

function findStatusCodes(source: string): { code: number; index: number }[] {
  const found: { code: number; index: number }[] = [];
  for (const re of STATUS_PATTERNS) {
    for (const m of source.matchAll(re)) {
      const code = Number(m[1]);
      if (code >= 400 && code < 600) found.push({ code, index: m.index ?? 0 });
    }
  }
  return found.sort((a, b) => a.index - b.index);
}

export interface ParsedRouteError {
  code: number;
  label: string;
  /** "status" = an explicit status code found in the route body; "db-timeout" = inferred from a try/catch wrapping a DB call. */
  origin: "status" | "db-timeout";
}

export interface ParsedRoute {
  method: string;
  path: string;
  kind: "route" | "fetch";
  envVars: string[];
  dbCalls: string[];
  errors: ParsedRouteError[];
}

export interface ParseResult {
  routes: ParsedRoute[];
  envVars: string[];
  dbCalls: string[];
}

export function parseCode(source: string): ParseResult {
  let rawRoutes = findRoutes(source);
  const envMatches = findEnvVars(source);
  const dbMatches = findDbCalls(source);
  const statusMatches = findStatusCodes(source);

  if (rawRoutes.length === 0 && (envMatches.length > 0 || dbMatches.length > 0)) {
    rawRoutes = [{ method: "FN", path: "handler", index: 0, kind: "route" }];
  }

  const routes: ParsedRoute[] = rawRoutes.map((route, i) => {
    const start = i === 0 ? 0 : route.index;
    const end = i + 1 < rawRoutes.length ? rawRoutes[i + 1].index : Infinity;
    const envVars = uniq(envMatches.filter((e) => e.index >= start && e.index < end).map((e) => e.name));
    const dbCalls = uniq(dbMatches.filter((d) => d.index >= start && d.index < end).map((d) => d.expr));
    const slice = source.slice(Math.max(0, start), end === Infinity ? source.length : end);

    const statusCodes = uniq(
      statusMatches.filter((s) => s.index >= start && s.index < end).map((s) => String(s.code)),
    ).map(Number);
    const errors: ParsedRouteError[] = statusCodes.map((code) => ({
      code,
      label: labelForStatus(code),
      origin: "status" as const,
    }));
    if (dbCalls.length > 0 && hasTryCatch(slice)) {
      errors.push({ code: 503, label: "DB Timeout", origin: "db-timeout" });
    }

    return { method: route.method, path: route.path, kind: route.kind, envVars, dbCalls, errors };
  });

  return {
    routes,
    envVars: uniq(envMatches.map((e) => e.name)),
    dbCalls: uniq(dbMatches.map((d) => d.expr)),
  };
}

export interface RouteErrorScenario {
  id: string;
  code: number;
  label: string;
  origin: "status" | "db-timeout";
  hops: SimHop[];
}

export interface RouteScenario {
  /** Unique within a topology (prefixed further when merged across files). */
  key: string;
  routeIndex: number;
  method: string;
  path: string;
  kind: "route" | "fetch";
  successHops: SimHop[];
  errors: RouteErrorScenario[];
}

export interface DynamicTopology {
  nodes: Node<ServiceNodeData>[];
  edges: Edge<TraceEdgeData>[];
  hops: SimHop[];
  routeScenarios: RouteScenario[];
}

const CLIENT_X = 40;
const API_X = 440;
const SIDE_X = 860;
const ROW_H = 130;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function slug(path: string): string {
  const cleaned = path.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
  return cleaned || "ROOT";
}

export function buildDynamicTopology(result: ParseResult): DynamicTopology | null {
  if (result.routes.length === 0) return null;

  const hasEnv = result.envVars.length > 0;
  const hasDb = result.dbCalls.length > 0;
  const apiCount = result.routes.length;
  const clientY = Math.max(40, ((apiCount - 1) * ROW_H) / 2 + 40);

  const nodes: Node<ServiceNodeData>[] = [
    {
      id: "client",
      type: "service",
      position: { x: CLIENT_X, y: clientY },
      data: {
        label: "Client",
        subtitle: "Parsed entry point",
        icon: "globe",
        status: "idle",
      },
    },
  ];
  const edges: Edge<TraceEdgeData>[] = [];
  const hops: SimHop[] = [];
  const routeScenarios: RouteScenario[] = [];

  result.routes.forEach((route, i) => {
    const nodeId = `api-${i}`;
    const isSynthetic = route.method === "FN";
    const label = isSynthetic ? "Code Handler" : `${route.method} ${route.path}`;
    const subtitle = isSynthetic ? "Parsed snippet" : route.kind === "fetch" ? "Outbound call" : "Route handler";
    const routeHops: SimHop[] = [];

    nodes.push({
      id: nodeId,
      type: "service",
      position: { x: API_X, y: i * ROW_H + 40 },
      data: {
        label: truncate(label, 30),
        subtitle: truncate(subtitle, 34),
        icon: route.kind === "fetch" ? "globe" : "shield",
        status: "idle",
      },
    });

    edges.push({
      id: `e-client-${nodeId}`,
      source: "client",
      target: nodeId,
      type: "trace",
      data: { status: "idle", reversed: false },
    });
    const callHop: SimHop = {
      fromNode: "client",
      toNode: nodeId,
      stepName: isSynthetic ? "INVOKE_HANDLER" : `CALL_${slug(route.path)}`,
      payload: { method: route.method, path: route.path },
      latencyMs: 160 + i * 15,
      outcome: "success",
      badgeLabel: "200 OK",
      edgeLabel: "200",
    };
    hops.push(callHop);
    routeHops.push(callHop);

    if (route.envVars.length > 0) {
      edges.push({
        id: `e-${nodeId}-env`,
        source: nodeId,
        target: "env",
        type: "trace",
        data: { status: "idle", reversed: false },
      });
      const envHop: SimHop = {
        fromNode: nodeId,
        toNode: "env",
        stepName: "READ_ENV",
        payload: { keys: route.envVars },
        latencyMs: 30,
        outcome: "success",
      };
      hops.push(envHop);
      routeHops.push(envHop);
    }

    if (route.dbCalls.length > 0) {
      edges.push({
        id: `e-${nodeId}-database`,
        source: nodeId,
        target: "database",
        type: "trace",
        data: { status: "idle", reversed: false },
      });
      const dbHop: SimHop = {
        fromNode: nodeId,
        toNode: "database",
        stepName: "DB_QUERY",
        payload: { calls: route.dbCalls },
        latencyMs: 320,
        outcome: "success",
      };
      hops.push(dbHop);
      routeHops.push(dbHop);
    }

    const errorScenarios: RouteErrorScenario[] = route.errors.map((err) => {
      if (err.origin === "db-timeout") {
        return {
          id: `err-db-timeout`,
          code: err.code,
          label: err.label,
          origin: err.origin,
          hops: [
            callHop,
            {
              fromNode: nodeId,
              toNode: "database",
              stepName: "DB_TIMEOUT",
              payload: { status: err.code, error: "Database connection timed out" },
              latencyMs: 650,
              outcome: "error",
              badgeLabel: `${err.code} · ${err.label}`,
              edgeLabel: String(err.code),
            },
          ],
        };
      }
      return {
        id: `err-status-${err.code}`,
        code: err.code,
        label: err.label,
        origin: err.origin,
        hops: [
          {
            fromNode: "client",
            toNode: nodeId,
            stepName: `ERR_${err.code}`,
            payload: { status: err.code, error: err.label },
            latencyMs: 140 + i * 10,
            outcome: "error",
            badgeLabel: `${err.code} · ${err.label}`,
            edgeLabel: String(err.code),
          },
        ],
      };
    });

    routeScenarios.push({
      key: `r${i}`,
      routeIndex: i,
      method: route.method,
      path: route.path,
      kind: route.kind,
      successHops: routeHops,
      errors: errorScenarios,
    });
  });

  if (hasEnv) {
    nodes.push({
      id: "env",
      type: "service",
      position: { x: SIDE_X, y: 20 },
      data: {
        label: ".env Secrets",
        subtitle: truncate(result.envVars.join(", "), 34),
        icon: "key",
        status: "idle",
      },
    });
  }

  if (hasDb) {
    nodes.push({
      id: "database",
      type: "service",
      position: { x: SIDE_X, y: apiCount * ROW_H + 40 },
      data: {
        label: "Database",
        subtitle: truncate(result.dbCalls.join(", "), 34),
        icon: "database",
        status: "idle",
      },
    });
  }

  return { nodes, edges, hops, routeScenarios };
}

export interface DynamicScenario {
  id: string;
  routeIndex: number;
  method: string;
  path: string;
  kind: "success" | "error";
  statusCode?: number;
  label: string;
  hops: SimHop[];
}

/** Flattens a topology's per-route scenarios into the button list the toolbar renders. */
export function toDynamicScenarios(routeScenarios: RouteScenario[]): DynamicScenario[] {
  const scenarios: DynamicScenario[] = [];
  for (const rs of routeScenarios) {
    const isSynthetic = rs.method === "FN";
    scenarios.push({
      id: `${rs.key}-success`,
      routeIndex: rs.routeIndex,
      method: rs.method,
      path: rs.path,
      kind: "success",
      label: isSynthetic ? "Run Handler" : `Test ${rs.method} ${rs.path}`,
      hops: rs.successHops,
    });
    for (const err of rs.errors) {
      scenarios.push({
        id: `${rs.key}-${err.id}`,
        routeIndex: rs.routeIndex,
        method: rs.method,
        path: rs.path,
        kind: "error",
        statusCode: err.code,
        label: err.origin === "db-timeout" ? `Trigger ${err.label}` : `Simulate ${err.code} ${err.label}`,
        hops: err.hops,
      });
    }
  }
  return scenarios;
}

export interface CodePreset {
  id: string;
  label: string;
  fileName: string;
  code: string;
}

export const CODE_PRESETS: CodePreset[] = [
  {
    id: "express",
    label: "Node.js Express App",
    fileName: "app.js",
    code: `const express = require('express');
const app = express();

app.post('/api/login', async (req, res) => {
  const secret = process.env.JWT_SECRET;
  let user;
  try {
    user = await db.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
  } catch (err) {
    return res.status(503).json({ error: 'Database unavailable' });
  }

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ token: secret });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
`,
  },
  {
    id: "nextjs",
    label: "Next.js Route Handler",
    fileName: "route.ts",
    code: `import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const dbUrl = process.env.DATABASE_URL;
  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const res = await fetch('https://api.example.com/status');
  return NextResponse.json(await res.json());
}
`,
  },
  {
    id: "fastapi",
    label: "Python FastAPI",
    fileName: "main.py",
    code: `from fastapi import FastAPI, HTTPException
import os
from database import db_session

app = FastAPI()

@app.post("/api/signup")
async def signup(payload: dict):
    api_key = os.getenv("STRIPE_API_KEY")
    try:
        existing = db_session.query(User).filter_by(email=payload["email"]).first()
    except Exception:
        raise HTTPException(status_code=503, detail="database timeout")

    if existing:
        raise HTTPException(status_code=400, detail="already exists")

    return {"status": "created"}

@app.get("/api/ping")
async def ping():
    return {"pong": True}
`,
  },
];
