"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ReactFlowProvider } from "@xyflow/react";
import FlowCanvas from "@/components/FlowCanvas";
import ControlPanel from "@/components/ControlPanel";
import FileExplorerPanel from "@/components/FileExplorerPanel";
import CodeViewerPanel from "@/components/CodeViewerPanel";
import EventLog from "@/components/EventLog";
import SimulateToolbar from "@/components/SimulateToolbar";
import DynamicScenarioToolbar from "@/components/DynamicScenarioToolbar";
import NodeInspectorDrawer from "@/components/NodeInspectorDrawer";
import TopNavBar from "@/components/TopNavBar";
import CodeIngestModal from "@/components/CodeIngestModal";
import ShareModal from "@/components/ShareModal";
import SharedFlowView from "@/components/SharedFlowView";
import AiAuditModal from "@/components/AiAuditModal";
import ArchitectureDiffModal from "@/components/ArchitectureDiffModal";
import ReplayTimeline from "@/components/ReplayTimeline";
import { decodeSharedFlow, type SharedFlow } from "@/lib/shareCodec";
import { useTraceSocket } from "@/hooks/useTraceSocket";
import { useReplayTimeline } from "@/hooks/useReplayTimeline";
import { computeReplayState } from "@/lib/replay";

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
    ingestedFiles,
    selectedFilePath,
    selectFile,
    loadTestActive,
    loadTestRate,
    startLoadTest,
    stopLoadTest,
    setLoadTestRate,
    topologyNodes,
    topologyEdges,
    dynamicScenarios,
    activeScenarioId,
    runDynamicScenario,
  } = useTraceSocket();

  const replay = useReplayTimeline(log);
  const canvasState = useMemo(
    () =>
      replay.isLive
        ? { nodes, edges }
        : computeReplayState(topologyNodes, topologyEdges, replay.chronological, replay.effectiveIndex),
    [replay.isLive, replay.chronological, replay.effectiveIndex, nodes, edges, topologyNodes, topologyEdges],
  );

  const [ingestOpen, setIngestOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileLogOpen, setMobileLogOpen] = useState(false);
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

  const selectedFileEntry = useMemo(
    () => (selectedFilePath ? ingestedFiles.find((f) => f.file.path === selectedFilePath) ?? null : null),
    [ingestedFiles, selectedFilePath],
  );
  const showCodeViewer = selectedFileEntry !== null && !selectedFileEntry.isFlowchartReady;

  const busy = running || simActive !== null;

  if (sharedFlow === "checking") return null;
  if (sharedFlow) return <SharedFlowView flow={sharedFlow} />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas dark:bg-slate-950">
      <TopNavBar
        connected={connected}
        customGraphActive={customGraphActive}
        disabled={busy}
        onOpenIngest={() => setIngestOpen(true)}
        onLoadDemo={loadDemoTopology}
        onShare={() => setShareOpen(true)}
        onAudit={() => setAuditOpen(true)}
        onCompareArchitecture={() => setCompareOpen(true)}
        onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
        onToggleLog={() => setMobileLogOpen((v) => !v)}
      />
      <main className="relative flex min-h-0 flex-1 overflow-hidden">
        {(mobileSidebarOpen || mobileLogOpen) && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] md:hidden"
            onClick={() => {
              setMobileSidebarOpen(false);
              setMobileLogOpen(false);
            }}
          />
        )}

        <div
          className={clsx(
            "fixed inset-y-0 left-0 z-40 h-full transition-transform duration-300 ease-out md:static md:z-auto md:shrink-0 md:translate-x-0",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {customGraphActive ? (
            <FileExplorerPanel files={ingestedFiles} selectedFilePath={selectedFilePath} onSelectFile={selectFile} />
          ) : (
            <ControlPanel
              connected={connected}
              running={busy}
              currentScenario={currentScenario}
              onTrigger={triggerFlow}
              onReset={resetCanvas}
            />
          )}
        </div>

        <div className="relative h-full flex-1">
          {showCodeViewer && selectedFileEntry ? (
            <CodeViewerPanel entry={selectedFileEntry} />
          ) : (
            <>
              {customGraphActive ? (
                <DynamicScenarioToolbar
                  scenarios={dynamicScenarios}
                  activeScenarioId={activeScenarioId}
                  disabled={busy}
                  onRunScenario={runDynamicScenario}
                  loadTestActive={loadTestActive}
                  loadTestRate={loadTestRate}
                  onStartLoadTest={startLoadTest}
                  onStopLoadTest={stopLoadTest}
                  onChangeLoadTestRate={setLoadTestRate}
                />
              ) : (
                <SimulateToolbar
                  simActive={simActive}
                  disabled={busy}
                  onSimulate={simulateRequest}
                  loadTestActive={loadTestActive}
                  loadTestRate={loadTestRate}
                  onStartLoadTest={startLoadTest}
                  onStopLoadTest={stopLoadTest}
                  onChangeLoadTestRate={setLoadTestRate}
                />
              )}
              <ReactFlowProvider>
                <FlowCanvas
                  nodes={canvasState.nodes}
                  edges={canvasState.edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                  onPaneClick={handleCloseDrawer}
                />
              </ReactFlowProvider>
              <ReplayTimeline
                chronological={replay.chronological}
                effectiveIndex={replay.effectiveIndex}
                isLive={replay.isLive}
                playing={replay.playing}
                speed={replay.speed}
                onSeek={replay.seek}
                onStepBack={replay.stepBack}
                onStepForward={replay.stepForward}
                onTogglePlay={replay.togglePlay}
                onGoLive={replay.goLive}
                onSetSpeed={replay.setSpeed}
              />
            </>
          )}
        </div>

        <div
          className={clsx(
            "fixed inset-y-0 right-0 z-40 h-full transition-transform duration-300 ease-out md:static md:z-auto md:shrink-0 md:translate-x-0",
            mobileLogOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <EventLog log={log} />
        </div>
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
      <ArchitectureDiffModal open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  );
}
