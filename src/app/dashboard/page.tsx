"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import FlowCanvas from "@/components/FlowCanvas";
import ControlPanel from "@/components/ControlPanel";
import EventLog from "@/components/EventLog";
import SimulateToolbar from "@/components/SimulateToolbar";
import NodeInspectorDrawer from "@/components/NodeInspectorDrawer";
import TopNavBar from "@/components/TopNavBar";
import CodeIngestModal from "@/components/CodeIngestModal";
import ShareModal from "@/components/ShareModal";
import SharedFlowView from "@/components/SharedFlowView";
import AiAuditModal from "@/components/AiAuditModal";
import { decodeSharedFlow, type SharedFlow } from "@/lib/shareCodec";
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
    lastIngestedSource,
  } = useTraceSocket();

  const [ingestOpen, setIngestOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [sharedFlow, setSharedFlow] = useState<SharedFlow | null | "checking">("checking");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("flow");
    setSharedFlow(encoded ? decodeSharedFlow(encoded) : null);
  }, []);

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

  if (sharedFlow === "checking") return null;
  if (sharedFlow) return <SharedFlowView flow={sharedFlow} />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <TopNavBar
        connected={connected}
        customGraphActive={customGraphActive}
        disabled={busy}
        onOpenIngest={() => setIngestOpen(true)}
        onLoadDemo={loadDemoTopology}
        onShare={() => setShareOpen(true)}
        onAudit={() => setAuditOpen(true)}
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
          <SimulateToolbar simActive={simActive} disabled={busy} onSimulate={simulateRequest} />
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
      <CodeIngestModal open={ingestOpen} onClose={() => setIngestOpen(false)} onRun={loadCustomGraph} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} nodes={nodes} edges={edges} log={log} />
      <AiAuditModal
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        sourceCode={lastIngestedSource}
        nodes={nodes}
        nodeActivity={nodeActivity}
        graphLabel={customGraphActive ? "Custom Graph" : "Demo Topology"}
      />
    </div>
  );
}
