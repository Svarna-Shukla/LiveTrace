"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
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
import AuthModal from "@/components/AuthModal";
import SaveWorkflowModal from "@/components/SaveWorkflowModal";
import { decodeSharedFlow, type SharedFlow } from "@/lib/shareCodec";
import { useTraceSocket } from "@/hooks/useTraceSocket";
import { useReplayTimeline } from "@/hooks/useReplayTimeline";
import { computeReplayState } from "@/lib/replay";
import { runCodeAudit } from "@/lib/codeAudit";

export default function CanvasPage() {
  const { data: session } = useSession();
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
    loadSavedWorkflow,
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

  const [authOpen, setAuthOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [currentWorkflowName, setCurrentWorkflowName] = useState("My Workflow");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("flow");
    setSharedFlow(encoded ? decodeSharedFlow(encoded) : null);

    const workflowId = params.get("workflow");
    if (workflowId) {
      fetch(`/api/workflows/${workflowId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.workflow) return;
          loadSavedWorkflow(data.workflow.nodes, data.workflow.edges, data.workflow.sourceCode);
          setCurrentWorkflowId(data.workflow.id);
          setCurrentWorkflowName(data.workflow.name);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(null), 2500);
    return () => clearTimeout(t);
  }, [savedToast]);

  const handleOpenSave = useCallback(() => {
    setSaveError(null);
    if (!session) {
      setAuthOpen(true);
      return;
    }
    setSaveOpen(true);
  }, [session]);

  const handleAuthenticated = useCallback(() => {
    setSaveOpen(true);
  }, []);

  const handleConfirmSave = useCallback(
    async (name: string) => {
      setSaving(true);
      setSaveError(null);
      const audit = runCodeAudit(lastIngestedSource, topologyNodes, nodeActivity);
      const latencies = audit.latencyRows.map((r) => r.latencyMs).filter((v): v is number => v !== null);
      const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;
      const latencyScore = avgLatency !== null ? Math.max(0, Math.min(100, Math.round(100 - avgLatency / 5))) : null;
      const payload = {
        name,
        nodes: topologyNodes,
        edges: topologyEdges,
        sourceCode: lastIngestedSource,
        healthScore: audit.hasSource ? audit.healthScore : null,
        latencyScore,
      };
      try {
        const res = await fetch(currentWorkflowId ? `/api/workflows/${currentWorkflowId}` : "/api/workflows", {
          method: currentWorkflowId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveError(data.error ?? "Could not save workflow.");
          setSaving(false);
          return;
        }
        setCurrentWorkflowId(data.workflow.id);
        setCurrentWorkflowName(data.workflow.name);
        setSaving(false);
        setSaveOpen(false);
        setSavedToast(`Saved "${data.workflow.name}"`);
      } catch {
        setSaveError("Network error — try again.");
        setSaving(false);
      }
    },
    [currentWorkflowId, lastIngestedSource, topologyNodes, topologyEdges, nodeActivity],
  );

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
        userLabel={session?.user?.name ?? session?.user?.email ?? null}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={() => signOut()}
        onSaveWorkflow={handleOpenSave}
        saving={saving}
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
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={handleAuthenticated} />
      <SaveWorkflowModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleConfirmSave}
        initialName={currentWorkflowName}
        isUpdate={currentWorkflowId !== null}
        saving={saving}
        error={saveError}
      />
      {savedToast && (
        <div className="animate-fade-in-up fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[12.5px] font-semibold text-emerald-700 shadow-lg dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {savedToast}
        </div>
      )}
    </div>
  );
}
