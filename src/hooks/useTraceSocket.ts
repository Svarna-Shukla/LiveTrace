"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEdgesState, useNodesState, type Edge, type Node } from "@xyflow/react";
import { getSocket } from "@/lib/socket-client";
import { initialEdges, initialNodes, resolveEdge, type ServiceNodeData, type TraceEdgeData } from "@/lib/topology";
import { buildDynamicHops, buildDynamicSpikeHop, type SimHop } from "@/lib/simulate";
import { buildScenarioHops } from "@/lib/scenarioHops";
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
  const [customGraphActive, setCustomGraphActive] = useState(false);
  const [lastIngestedSource, setLastIngestedSource] = useState<string | null>(null);

  const nodeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const edgeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const simCancelRef = useRef(0);
  const connectedRef = useRef(false);
  // Structural baseline (ids/source/target only matter here) of whichever
  // topology — built-in demo or a parsed custom graph — is currently active.
  // Used for edge resolution, dynamic trace generation, and for restoring
  // idle state on reset, so it stays independent of the live render state.
  const topologyNodesRef = useRef<Node<ServiceNodeData>[]>(initialNodes);
  const topologyEdgesRef = useRef<Edge<TraceEdgeData>[]>(initialEdges);

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
            e.id === edgeId
              ? { ...e, data: { ...e.data, status: "idle", label: undefined, latencyMs: undefined } as TraceEdgeData }
              : e,
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

      const resolved = resolveEdge(step.fromNode, step.toNode, topologyEdgesRef.current);
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
                    latencyMs: step.latencyMs,
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

    const handleConnect = () => {
      connectedRef.current = true;
      setConnected(true);
    };
    const handleDisconnect = () => {
      connectedRef.current = false;
      setConnected(false);
    };
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

    if (socket.connected) {
      connectedRef.current = true;
      setConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(EVENTS.TRACE_STEP, handleTraceStep);
      socket.off(EVENTS.FLOW_START, handleFlowStart);
      socket.off(EVENTS.FLOW_END, handleFlowEnd);
      socket.off(EVENTS.FLOW_BUSY, handleFlowBusy);
    };
  }, [recordStep]);

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

  // Local (no-socket-required) fallback runner for the sidebar's server-style
  // scenarios, so they keep working even without a live connection.
  const runScenarioLocally = useCallback(
    async (scenario: FlowScenario) => {
      const hops = buildScenarioHops(scenario);
      if (hops.length === 0) return;
      const token = ++simCancelRef.current;
      setRunning(true);
      setCurrentScenario(scenario);
      try {
        await runSequentialHops(hops, token);
      } finally {
        if (simCancelRef.current === token) {
          setRunning(false);
        }
      }
    },
    [runSequentialHops],
  );

  const triggerFlow = useCallback(
    (scenario: FlowScenario) => {
      if (running || simActive || customGraphActive) return;
      if (connectedRef.current) {
        getSocket().emit(EVENTS.TRIGGER_FLOW, { scenario });
      } else {
        void runScenarioLocally(scenario);
      }
    },
    [running, simActive, customGraphActive, runScenarioLocally],
  );

  const runTrafficSpike = useCallback(
    async (token: number) => {
      const bursts = Array.from({ length: 10 }, (_, i) =>
        buildDynamicSpikeHop(topologyNodesRef.current, topologyEdgesRef.current, i),
      ).filter((hop): hop is SimHop => hop !== null);
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

  const runHops = useCallback(
    async (hops: SimHop[], kind: SimulationKind) => {
      const token = ++simCancelRef.current;
      setSimActive(kind);
      try {
        await runSequentialHops(hops, token);
      } finally {
        if (simCancelRef.current === token) setSimActive(null);
      }
    },
    [runSequentialHops],
  );

  const simulateRequest = useCallback(
    (kind: SimulationKind) => {
      if (running || simActive) return;
      if (kind === "traffic-spike") {
        const token = ++simCancelRef.current;
        setSimActive(kind);
        void runTrafficSpike(token).finally(() => {
          if (simCancelRef.current === token) setSimActive(null);
        });
      } else {
        const dynamicKind = kind === "success-login" ? "success" : "error";
        const hops = buildDynamicHops(topologyNodesRef.current, topologyEdgesRef.current, dynamicKind);
        void runHops(hops, kind);
      }
    },
    [running, simActive, runTrafficSpike, runHops],
  );

  const loadTopology = useCallback(
    (newNodes: Node<ServiceNodeData>[], newEdges: Edge<TraceEdgeData>[], custom: boolean) => {
      simCancelRef.current += 1;
      nodeTimers.current.forEach((t) => clearTimeout(t));
      nodeTimers.current.clear();
      edgeTimers.current.forEach((t) => clearTimeout(t));
      edgeTimers.current.clear();
      topologyNodesRef.current = newNodes;
      topologyEdgesRef.current = newEdges;
      setNodes(newNodes);
      setEdges(newEdges);
      setLog([]);
      setNodeActivity({});
      setCurrentScenario(null);
      setSimActive(null);
      setSelectedNodeId(null);
      setCustomGraphActive(custom);
    },
    [setEdges, setNodes],
  );

  const loadCustomGraph = useCallback(
    (newNodes: Node<ServiceNodeData>[], newEdges: Edge<TraceEdgeData>[], hops: SimHop[], sourceCode: string) => {
      if (running || simActive) return;
      loadTopology(newNodes, newEdges, true);
      setLastIngestedSource(sourceCode);
      void runHops(hops, "custom");
    },
    [running, simActive, loadTopology, runHops],
  );

  const loadDemoTopology = useCallback(() => {
    if (running || simActive) return;
    loadTopology(initialNodes, initialEdges, false);
    setLastIngestedSource(null);
  }, [running, simActive, loadTopology]);

  const resetCanvas = useCallback(() => {
    simCancelRef.current += 1;
    nodeTimers.current.forEach((t) => clearTimeout(t));
    nodeTimers.current.clear();
    edgeTimers.current.forEach((t) => clearTimeout(t));
    edgeTimers.current.clear();
    setNodes(topologyNodesRef.current);
    setEdges(topologyEdgesRef.current);
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
    customGraphActive,
    loadCustomGraph,
    loadDemoTopology,
    lastIngestedSource,
  };
}
