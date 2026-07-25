import { randomUUID } from "node:crypto";
import type { Server as IOServer } from "socket.io";
import { EVENTS } from "../lib/types";
import type { ExecutionStep, FlowScenario } from "../lib/types";
import { buildScenarioHops } from "../lib/scenarioHops";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let isFlowRunning = false;

export function flowInProgress(): boolean {
  return isFlowRunning;
}

export async function runFlow(io: IOServer, scenario: FlowScenario): Promise<void> {
  if (isFlowRunning) {
    io.emit(EVENTS.FLOW_BUSY, { scenario, timestamp: Date.now() });
    return;
  }

  const hops = buildScenarioHops(scenario);
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
