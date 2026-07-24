import { randomUUID } from "node:crypto";
import type { Server as IOServer } from "socket.io";
import { EVENTS } from "../lib/types";
import type { ExecutionStep, FlowScenario } from "../lib/types";

interface Hop {
  fromNode: string;
  toNode: string;
  stepName: string;
  payload: Record<string, unknown>;
  latencyMs: number;
  outcome: "success" | "error";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildHops(scenario: FlowScenario): Hop[] {
  switch (scenario) {
    case "login-success":
      return [
        {
          fromNode: "webapp",
          toNode: "authapi",
          stepName: "REQUEST_LOGIN",
          payload: { method: "POST", path: "/api/auth/login", body: { email: "demo@livetrace.dev" } },
          latencyMs: 220,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "envsecrets",
          stepName: "CHECK_ENV_KEY",
          payload: { key: "JWT_SECRET" },
          latencyMs: 140,
          outcome: "success",
        },
        {
          fromNode: "envsecrets",
          toNode: "authapi",
          stepName: "ENV_KEY_LOADED",
          payload: { key: "JWT_SECRET", found: true },
          latencyMs: 80,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 260,
          outcome: "success",
        },
        {
          fromNode: "database",
          toNode: "authapi",
          stepName: "USER_FOUND",
          payload: { rows: 1 },
          latencyMs: 90,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "authapi",
          stepName: "VERIFY_HASH",
          payload: { algorithm: "bcrypt", match: true },
          latencyMs: 180,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "webapp",
          stepName: "RESPONSE_200",
          payload: { status: 200, token: "eyJhbGciOiJIUzI1NiIs..." },
          latencyMs: 60,
          outcome: "success",
        },
      ];
    case "invalid-password":
      return [
        {
          fromNode: "webapp",
          toNode: "authapi",
          stepName: "REQUEST_LOGIN",
          payload: { method: "POST", path: "/api/auth/login", body: { email: "demo@livetrace.dev" } },
          latencyMs: 220,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "envsecrets",
          stepName: "CHECK_ENV_KEY",
          payload: { key: "JWT_SECRET" },
          latencyMs: 140,
          outcome: "success",
        },
        {
          fromNode: "envsecrets",
          toNode: "authapi",
          stepName: "ENV_KEY_LOADED",
          payload: { key: "JWT_SECRET", found: true },
          latencyMs: 80,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 260,
          outcome: "success",
        },
        {
          fromNode: "database",
          toNode: "authapi",
          stepName: "USER_FOUND",
          payload: { rows: 1 },
          latencyMs: 90,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "authapi",
          stepName: "VERIFY_HASH",
          payload: { algorithm: "bcrypt", match: false },
          latencyMs: 180,
          outcome: "error",
        },
        {
          fromNode: "authapi",
          toNode: "webapp",
          stepName: "RESPONSE_401",
          payload: { status: 401, error: "Invalid credentials" },
          latencyMs: 60,
          outcome: "error",
        },
      ];
    case "user-not-found":
      return [
        {
          fromNode: "webapp",
          toNode: "authapi",
          stepName: "REQUEST_LOGIN",
          payload: { method: "POST", path: "/api/auth/login", body: { email: "ghost@livetrace.dev" } },
          latencyMs: 220,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "envsecrets",
          stepName: "CHECK_ENV_KEY",
          payload: { key: "JWT_SECRET" },
          latencyMs: 140,
          outcome: "success",
        },
        {
          fromNode: "envsecrets",
          toNode: "authapi",
          stepName: "ENV_KEY_LOADED",
          payload: { key: "JWT_SECRET", found: true },
          latencyMs: 80,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 260,
          outcome: "success",
        },
        {
          fromNode: "database",
          toNode: "authapi",
          stepName: "USER_NOT_FOUND",
          payload: { rows: 0 },
          latencyMs: 90,
          outcome: "error",
        },
        {
          fromNode: "authapi",
          toNode: "webapp",
          stepName: "RESPONSE_404",
          payload: { status: 404, error: "User not found" },
          latencyMs: 60,
          outcome: "error",
        },
      ];
    case "env-missing":
      return [
        {
          fromNode: "webapp",
          toNode: "authapi",
          stepName: "REQUEST_LOGIN",
          payload: { method: "POST", path: "/api/auth/login", body: { email: "demo@livetrace.dev" } },
          latencyMs: 220,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "envsecrets",
          stepName: "CHECK_ENV_KEY",
          payload: { key: "JWT_SECRET" },
          latencyMs: 140,
          outcome: "success",
        },
        {
          fromNode: "envsecrets",
          toNode: "authapi",
          stepName: "ENV_KEY_MISSING",
          payload: { key: "JWT_SECRET", found: false },
          latencyMs: 80,
          outcome: "error",
        },
        {
          fromNode: "authapi",
          toNode: "webapp",
          stepName: "RESPONSE_500",
          payload: { status: 500, error: "Server misconfiguration: missing JWT_SECRET" },
          latencyMs: 60,
          outcome: "error",
        },
      ];
    case "db-error":
      return [
        {
          fromNode: "webapp",
          toNode: "authapi",
          stepName: "REQUEST_LOGIN",
          payload: { method: "POST", path: "/api/auth/login", body: { email: "demo@livetrace.dev" } },
          latencyMs: 220,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "envsecrets",
          stepName: "CHECK_ENV_KEY",
          payload: { key: "JWT_SECRET" },
          latencyMs: 140,
          outcome: "success",
        },
        {
          fromNode: "envsecrets",
          toNode: "authapi",
          stepName: "ENV_KEY_LOADED",
          payload: { key: "JWT_SECRET", found: true },
          latencyMs: 80,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 260,
          outcome: "success",
        },
        {
          fromNode: "database",
          toNode: "authapi",
          stepName: "DB_CONNECTION_ERROR",
          payload: { error: "ECONNREFUSED 127.0.0.1:5432" },
          latencyMs: 200,
          outcome: "error",
        },
        {
          fromNode: "authapi",
          toNode: "webapp",
          stepName: "RESPONSE_503",
          payload: { status: 503, error: "Database unavailable" },
          latencyMs: 60,
          outcome: "error",
        },
      ];
    default:
      return [];
  }
}

let isFlowRunning = false;

export function flowInProgress(): boolean {
  return isFlowRunning;
}

export async function runFlow(io: IOServer, scenario: FlowScenario): Promise<void> {
  if (isFlowRunning) {
    io.emit(EVENTS.FLOW_BUSY, { scenario, timestamp: Date.now() });
    return;
  }

  const hops = buildHops(scenario);
  if (hops.length === 0) return;

  isFlowRunning = true;
  io.emit(EVENTS.FLOW_START, { scenario, timestamp: Date.now() });

  let overallSuccess = true;

  try {
    for (const hop of hops) {
      const id = randomUUID();
      const runningStep: ExecutionStep = {
        id,
        fromNode: hop.fromNode,
        toNode: hop.toNode,
        stepName: hop.stepName,
        status: "running",
        latencyMs: hop.latencyMs,
        payload: {},
        timestamp: Date.now(),
      };
      io.emit(EVENTS.TRACE_STEP, runningStep);

      await sleep(hop.latencyMs);

      if (hop.outcome === "error") overallSuccess = false;

      const finalStep: ExecutionStep = {
        id,
        fromNode: hop.fromNode,
        toNode: hop.toNode,
        stepName: hop.stepName,
        status: hop.outcome,
        latencyMs: hop.latencyMs,
        payload: hop.payload,
        timestamp: Date.now(),
      };
      io.emit(EVENTS.TRACE_STEP, finalStep);

      await sleep(160);
    }
  } finally {
    isFlowRunning = false;
    io.emit(EVENTS.FLOW_END, { scenario, timestamp: Date.now(), success: overallSuccess });
  }
}
