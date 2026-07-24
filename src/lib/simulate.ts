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

export const SUCCESS_LOGIN_HOPS: SimHop[] = [
  {
    fromNode: "webapp",
    toNode: "authapi",
    stepName: "REQUEST_LOGIN",
    payload: { method: "POST", path: "/api/auth/login", body: { email: "demo@livetrace.dev" } },
    latencyMs: 200,
    outcome: "success",
    badgeLabel: "200 OK",
    edgeLabel: "200 OK",
  },
  {
    fromNode: "authapi",
    toNode: "envsecrets",
    stepName: "CHECK_ENV_KEY",
    payload: { key: "JWT_SECRET" },
    latencyMs: 160,
    outcome: "success",
    badgeLabel: "200 OK",
    edgeLabel: "200 OK",
  },
  {
    fromNode: "envsecrets",
    toNode: "authapi",
    stepName: "ENV_KEY_LOADED",
    payload: { key: "JWT_SECRET", found: true },
    latencyMs: 90,
    outcome: "success",
    badgeLabel: "200 OK",
  },
  {
    fromNode: "authapi",
    toNode: "database",
    stepName: "QUERY_USER",
    payload: { sql: "SELECT * FROM users WHERE email = $1" },
    latencyMs: 220,
    outcome: "success",
    badgeLabel: "200 OK",
    edgeLabel: "200 OK",
  },
  {
    fromNode: "database",
    toNode: "authapi",
    stepName: "USER_FOUND",
    payload: { rows: 1 },
    latencyMs: 100,
    outcome: "success",
    badgeLabel: "200 OK",
  },
  {
    fromNode: "authapi",
    toNode: "webapp",
    stepName: "RESPONSE_200",
    payload: { status: 200, token: "eyJhbGciOiJIUzI1NiIs..." },
    latencyMs: 70,
    outcome: "success",
    badgeLabel: "200 OK",
    edgeLabel: "200 OK",
  },
];

export const WRONG_PASSWORD_HOPS: SimHop[] = [
  {
    fromNode: "webapp",
    toNode: "authapi",
    stepName: "REQUEST_LOGIN",
    payload: { method: "POST", path: "/api/auth/login", body: { email: "demo@livetrace.dev" } },
    latencyMs: 200,
    outcome: "success",
  },
  {
    fromNode: "authapi",
    toNode: "envsecrets",
    stepName: "VERIFY_CREDENTIALS",
    payload: { status: 401, error: "Password mismatch" },
    latencyMs: 220,
    outcome: "error",
    badgeLabel: "401 · Password Mismatch",
    edgeLabel: "401",
  },
];

const TRAFFIC_EDGES: Array<{ fromNode: string; toNode: string }> = [
  { fromNode: "webapp", toNode: "authapi" },
  { fromNode: "authapi", toNode: "envsecrets" },
  { fromNode: "envsecrets", toNode: "authapi" },
  { fromNode: "authapi", toNode: "database" },
  { fromNode: "database", toNode: "authapi" },
];

const TRAFFIC_STEP_NAMES = ["PING", "HEALTH_CHECK", "REQUEST", "QUERY", "SYNC", "FETCH"];

export function buildTrafficSpikeHop(index: number): SimHop {
  const edge = TRAFFIC_EDGES[Math.floor(Math.random() * TRAFFIC_EDGES.length)];
  const outcome: "success" | "error" = Math.random() < 0.82 ? "success" : "error";
  const stepName = TRAFFIC_STEP_NAMES[Math.floor(Math.random() * TRAFFIC_STEP_NAMES.length)];
  return {
    ...edge,
    stepName: `${stepName}_${index + 1}`,
    payload: { requestId: `req_${Date.now()}_${index}` },
    latencyMs: 90 + Math.floor(Math.random() * 220),
    outcome,
  };
}
