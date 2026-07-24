"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEdgesState, useNodesState, type Edge, type Node } from "@xyflow/react";
import { getSocket } from "@/lib/socket-client";
import { initialEdges, initialNodes, resolveEdge, type ServiceNodeData, type TraceEdgeData } from "@/lib/topology";
import { buildTrafficSpikeHop, SUCCESS_LOGIN_HOPS, WRONG_PASSWORD_HOPS, type SimHop } from "@/lib/simulate";
import {
  EVENTS,
  type ExecutionStep,
  type FlowScenario,
  type FlowLifecycleEvent,
  type NodeActivityEntry,
  type SimulationKind,
} from "@/lib/types";

const SUCCESS_ERROR_REVERT_MS = 2600;
const RUNNING_FAILSAFE_MS = 9000;
const MAX_ACTIVITY_PER_NODE = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useTraceSocket() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ServiceNodeData>>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<TraceEdgeData>>(initialEdges);
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<FlowScenario | null>(null);
  const [log, setLog] = useState<ExecutionStep[]>([]);
  const [nodeActivity, setNodeActivity] = useState<Record<string, NodeActivityEntry[]>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [simActive, setSimActive] = useState<SimulationKind | null>(null);

  const nodeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const edgeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const simCancelRef = useRef(0);

  const scheduleNodeRevert = useCallback(
    (nodeId: string, delay: number) => {
      const timers = nodeTimers.current;
      const existing = timers.get(nodeId);
      if (existing) clearTimeout(existing);
      const timeout = setTimeout(() => {
        setNodes((nds) =>
          nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, status: "idle", badgeLabel: undefined } } : n)),
        );
        timers.delete(nodeId);
      }, delay);
      timers.set(nodeId, timeout);
    },
    [setNodes],
  );

  const scheduleEdgeRevert = useCallback(
    (edgeId: string, delay: number) => {
      const timers = edgeTimers.current;
      const existing = timers.get(edgeId);
      if (existing) clearTimeout(existing);
      const timeout = setTimeout(() => {
        setEdges((eds) =>
          eds.map((e) =>
            e.id === edgeId ? { ...e, data: { ...e.data, status: "idle", label: undefined } as TraceEdgeData } : e,
          ),
        );
        timers.delete(edgeId);
      }, delay);
      timers.set(edgeId, timeout);
    },
    [setEdges],
  );

  const recordStep = useCallback(
    (step: ExecutionStep, overrides?: { badgeLabel?: string; edgeLabel?: string }) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === step.toNode
            ? {
                ...n,
                data: {
                  ...n.data,
                  status: step.status,
                  lastStep: step.stepName,
                  lastLatency: step.status === "running" ? n.data.lastLatency : step.latencyMs,
                  badgeLabel: step.status === "running" ? undefined : overrides?.badgeLabel,
                },
              }
            : n,
        ),
      );
      scheduleNodeRevert(
        step.toNode,
        step.status === "running" ? RUNNING_FAILSAFE_MS : SUCCESS_ERROR_REVERT_MS,
      );

      const resolved = resolveEdge(step.fromNode, step.toNode);
      if (resolved) {
        setEdges((eds) =>
          eds.map((e) =>
            e.id === resolved.edgeId
              ? {
                  ...e,
                  data: {
                    status: step.status,
                    reversed: resolved.reversed,
                    label: step.status === "running" ? undefined : overrides?.edgeLabel,
                  } as TraceEdgeData,
                }
              : e,
          ),
        );
        scheduleEdgeRevert(
          resolved.edgeId,
          step.status === "running" ? RUNNING_FAILSAFE_MS : SUCCESS_ERROR_REVERT_MS,
        );
      }

      if (step.status === "success" || step.status === "error") {
        setLog((prev) => [step, ...prev].slice(0, 60));
        setNodeActivity((prev) => {
          const entry: NodeActivityEntry = {
            id: step.id,
            stepName: step.stepName,
            status: step.status,
            latencyMs: step.latencyMs,
            payload: step.payload,
            timestamp: step.timestamp,
            fromNode: step.fromNode,
            toNode: step.toNode,
          };
          const existing = prev[step.toNode] ?? [];
          return { ...prev, [step.toNode]: [entry, ...existing].slice(0, MAX_ACTIVITY_PER_NODE) };
        });
      }
    },
    [scheduleEdgeRevert, scheduleNodeRevert, setEdges, setNodes],
  );

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    const handleTraceStep = (step: ExecutionStep) => recordStep(step);

    const handleFlowStart = (evt: FlowLifecycleEvent) => {
      setRunning(true);
      setCurrentScenario(evt.scenario);
    };

    const handleFlowEnd = () => {
      setRunning(false);
    };

    const handleFlowBusy = () => {
      // no-op: UI already disables triggers while running
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(EVENTS.TRACE_STEP, handleTraceStep);
    socket.on(EVENTS.FLOW_START, handleFlowStart);
    socket.on(EVENTS.FLOW_END, handleFlowEnd);
    socket.on(EVENTS.FLOW_BUSY, handleFlowBusy);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(EVENTS.TRACE_STEP, handleTraceStep);
      socket.off(EVENTS.FLOW_START, handleFlowStart);
      socket.off(EVENTS.FLOW_END, handleFlowEnd);
      socket.off(EVENTS.FLOW_BUSY, handleFlowBusy);
    };
  }, [recordStep]);

  const triggerFlow = useCallback(
    (scenario: FlowScenario) => {
      if (running || simActive) return;
      getSocket().emit(EVENTS.TRIGGER_FLOW, { scenario });
    },
    [running, simActive],
  );

  const runSequentialHops = useCallback(
    async (hops: SimHop[], token: number) => {
      for (const hop of hops) {
        if (simCancelRef.current !== token) return;
        const id = `sim-${token}-${hop.stepName}-${Date.now()}`;
        const base: Omit<ExecutionStep, "status" | "payload"> = {
          id,
          fromNode: hop.fromNode,
          toNode: hop.toNode,
          stepName: hop.stepName,
          latencyMs: hop.latencyMs,
          timestamp: Date.now(),
        };
        recordStep({ ...base, status: "running", payload: {} });
        await sleep(hop.latencyMs);
        if (simCancelRef.current !== token) return;
        recordStep(
          { ...base, status: hop.outcome, payload: hop.payload, timestamp: Date.now() },
          { badgeLabel: hop.badgeLabel, edgeLabel: hop.edgeLabel },
        );
        await sleep(160);
      }
    },
    [recordStep],
  );

  const runTrafficSpike = useCallback(
    async (token: number) => {
      const bursts = Array.from({ length: 10 }, (_, i) => buildTrafficSpikeHop(i));
      bursts.forEach((hop, i) => {
        setTimeout(() => {
          if (simCancelRef.current !== token) return;
          const id = `sim-${token}-spike-${i}-${Date.now()}`;
          const base: Omit<ExecutionStep, "status" | "payload"> = {
            id,
            fromNode: hop.fromNode,
            toNode: hop.toNode,
            stepName: hop.stepName,
            latencyMs: hop.latencyMs,
            timestamp: Date.now(),
          };
          recordStep({ ...base, status: "running", payload: {} });
          setTimeout(() => {
            if (simCancelRef.current !== token) return;
            recordStep({ ...base, status: hop.outcome, payload: hop.payload, timestamp: Date.now() });
          }, hop.latencyMs);
        }, i * 110);
      });
      await sleep(10 * 110 + 500);
    },
    [recordStep],
  );

  const simulateRequest = useCallback(
    async (kind: SimulationKind) => {
      if (running || simActive) return;
      const token = ++simCancelRef.current;
      setSimActive(kind);
      try {
        if (kind === "success-login") {
          await runSequentialHops(SUCCESS_LOGIN_HOPS, token);
        } else if (kind === "wrong-password") {
          await runSequentialHops(WRONG_PASSWORD_HOPS, token);
        } else {
          await runTrafficSpike(token);
        }
      } finally {
        if (simCancelRef.current === token) setSimActive(null);
      }
    },
    [running, simActive, runSequentialHops, runTrafficSpike],
  );

  const resetCanvas = useCallback(() => {
    simCancelRef.current += 1;
    nodeTimers.current.forEach((t) => clearTimeout(t));
    nodeTimers.current.clear();
    edgeTimers.current.forEach((t) => clearTimeout(t));
    edgeTimers.current.clear();
    setNodes(initialNodes);
    setEdges(initialEdges);
    setLog([]);
    setNodeActivity({});
    setCurrentScenario(null);
    setSimActive(null);
    setSelectedNodeId(null);
  }, [setEdges, setNodes]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    connected,
    running,
    currentScenario,
    log,
    triggerFlow,
    resetCanvas,
    nodeActivity,
    selectedNodeId,
    setSelectedNodeId,
    simActive,
    simulateRequest,
  };
}
