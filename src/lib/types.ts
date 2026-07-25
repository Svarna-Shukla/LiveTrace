export type NodeStatus = "idle" | "running" | "success" | "error";

export interface ExecutionStep {
  id: string;
  fromNode: string;
  toNode: string;
  stepName: string;
  status: NodeStatus;
  latencyMs: number;
  payload: Record<string, unknown>;
  timestamp: number;
}

export type FlowScenario =
  | "login-success"
  | "invalid-password"
  | "user-not-found"
  | "env-missing"
  | "db-error";

export interface ScenarioMeta {
  id: FlowScenario;
  label: string;
  description: string;
  tone: "success" | "error";
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "login-success",
    label: "Login Success",
    description: "Full happy path: env check, user lookup, hash match, 200 OK",
    tone: "success",
  },
  {
    id: "invalid-password",
    label: "Wrong Password",
    description: "User found, bcrypt hash mismatch, 401 Unauthorized",
    tone: "error",
  },
  {
    id: "user-not-found",
    label: "Unknown User",
    description: "Query returns 0 rows, 404 Not Found",
    tone: "error",
  },
  {
    id: "env-missing",
    label: "Missing .env Key",
    description: "JWT_SECRET absent from secrets store, 500 Server Error",
    tone: "error",
  },
  {
    id: "db-error",
    label: "Database Down",
    description: "Connection refused mid-query, 503 Service Unavailable",
    tone: "error",
  },
];

export interface TriggerFlowPayload {
  scenario: FlowScenario;
}

export interface FlowLifecycleEvent {
  scenario: FlowScenario;
  timestamp: number;
  success?: boolean;
}

export interface NodeActivityEntry {
  id: string;
  stepName: string;
  status: NodeStatus;
  latencyMs: number;
  payload: Record<string, unknown>;
  timestamp: number;
  fromNode: string;
  toNode: string;
}

export type SimulationKind = "success-login" | "wrong-password" | "traffic-spike" | "custom" | "load-test";

export const SOCKET_PATH = "/api/socket";

export const EVENTS = {
  TRACE_STEP: "trace-step",
  TRIGGER_FLOW: "trigger-flow",
  FLOW_START: "flow-start",
  FLOW_END: "flow-end",
  FLOW_BUSY: "flow-busy",
} as const;
