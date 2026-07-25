"use client";

import { useCallback, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowCanvas from "@/components/FlowCanvas";
import ControlPanel from "@/components/ControlPanel";
import EventLog from "@/components/EventLog";
import SimulateToolbar from "@/components/SimulateToolbar";
import NodeInspectorDrawer from "@/components/NodeInspectorDrawer";
import TopNavBar from "@/components/TopNavBar";
import CodeIngestModal from "@/components/CodeIngestModal";
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
    customGraphActive,
    loadCustomGraph,
    loadDemoTopology,
  } = useTraceSocket();

  const [ingestOpen, setIngestOpen] = useState(false);

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <TopNavBar
        connected={connected}
        customGraphActive={customGraphActive}
        disabled={busy}
        onOpenIngest={() => setIngestOpen(true)}
        onLoadDemo={loadDemoTopology}
      />
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <ControlPanel
          connected={connected}
          running={busy}
          currentScenario={currentScenario}
          disabled={customGraphActive}
          onTrigger={triggerFlow}
          onReset={resetCanvas}
        />
        <div className="relative h-full flex-1">
          <SimulateToolbar
            simActive={simActive}
            disabled={busy || !connected || customGraphActive}
            onSimulate={simulateRequest}
          />
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
      </main>
      <NodeInspectorDrawer node={selectedNode} activity={selectedActivity} onClose={handleCloseDrawer} />
      <CodeIngestModal
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        onRun={loadCustomGraph}
      />
    </div>
  );
}
