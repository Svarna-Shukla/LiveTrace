"use client";

import { useCallback, useMemo } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowCanvas from "@/components/FlowCanvas";
import ControlPanel from "@/components/ControlPanel";
import EventLog from "@/components/EventLog";
import SimulateToolbar from "@/components/SimulateToolbar";
import NodeInspectorDrawer from "@/components/NodeInspectorDrawer";
import { useTraceSocket } from "@/hooks/useTraceSocket";

export default function DashboardPage() {
  const {
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
  } = useTraceSocket();

  const handleNodeClick = useCallback(
    (_event: unknown, node: { id: string }) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const handleCloseDrawer = useCallback(() => setSelectedNodeId(null), [setSelectedNodeId]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedActivity = useMemo(
    () => (selectedNodeId ? nodeActivity[selectedNodeId] ?? [] : []),
    [nodeActivity, selectedNodeId],
  );

  const busy = running || simActive !== null;

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-canvas">
      <ControlPanel
        connected={connected}
        running={busy}
        currentScenario={currentScenario}
        onTrigger={triggerFlow}
        onReset={resetCanvas}
      />
      <div className="relative h-full flex-1">
        <SimulateToolbar simActive={simActive} disabled={busy || !connected} onSimulate={simulateRequest} />
        <ReactFlowProvider>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handleCloseDrawer}
          />
        </ReactFlowProvider>
      </div>
      <EventLog log={log} />
      <NodeInspectorDrawer node={selectedNode} activity={selectedActivity} onClose={handleCloseDrawer} />
    </main>
  );
}
