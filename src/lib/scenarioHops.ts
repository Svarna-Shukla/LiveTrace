import type { FlowScenario } from "./types";

/**
 * Pure hop definitions for the built-in demo scenarios. Shared between the
 * Socket.IO server (src/server/demoFlows.ts) and the client-side local-mode
 * fallback runner (useTraceSocket) so scenarios keep working even when no
 * live socket connection is available.
 */
export interface Hop {
  fromNode: string;
  toNode: string;
  stepName: string;
  payload: Record<string, unknown>;
  latencyMs: number;
  outcome: "success" | "error";
}

export function buildScenarioHops(scenario: FlowScenario): Hop[] {
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
          latencyMs: 40,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 340,
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
          latencyMs: 40,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 340,
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
          latencyMs: 40,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 340,
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
          latencyMs: 40,
          outcome: "success",
        },
        {
          fromNode: "authapi",
          toNode: "database",
          stepName: "QUERY_USER",
          payload: { sql: "SELECT * FROM users WHERE email = $1" },
          latencyMs: 340,
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
