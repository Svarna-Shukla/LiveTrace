"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ReactFlowProvider, type Edge, type Node } from "@xyflow/react";
import { Zap } from "lucide-react";
import FlowCanvas from "./FlowCanvas";
import { categoryLabel, type SharedFlow } from "@/lib/shareCodec";
import type { ServiceNodeData, TraceEdgeData } from "@/lib/topology";

interface SharedFlowViewProps {
  flow: SharedFlow;
}

export default function SharedFlowView({ flow }: SharedFlowViewProps) {
  const nodes = useMemo<Node<ServiceNodeData>[]>(
    () =>
      flow.nodes.map((n) => ({
        id: n.id,
        type: "service",
        position: { x: n.x, y: n.y },
        draggable: false,
        data: {
          label: n.label,
          subtitle: categoryLabel(n.icon),
          icon: n.icon,
          status: "idle",
        },
      })),
    [flow.nodes],
  );

  const edges = useMemo<Edge<TraceEdgeData>[]>(
    () =>
      flow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "trace",
        data: { status: "idle", reversed: false },
      })),
    [flow.edges],
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-canvas">
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Zap size={16} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-800">LiveTrace</div>
            <div className="text-[10.5px] text-slate-400">Shared architecture diagram · read-only</div>
          </div>
          <span className="ml-2 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-600">
            Shared view
          </span>
        </div>
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
        >
          Open Full App
        </a>
      </header>
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <div className="relative h-full flex-1">
          <ReactFlowProvider>
            <FlowCanvas nodes={nodes} edges={edges} onNodesChange={() => {}} onEdgesChange={() => {}} />
          </ReactFlowProvider>
        </div>
        {flow.steps.length > 0 && (
          <div className="z-10 flex h-full w-[320px] shrink-0 flex-col border-l border-border bg-white/95 shadow-lg">
            <div className="border-b border-border px-3.5 py-2.5">
              <h2 className="text-xs font-bold text-slate-700">Execution Log</h2>
              <p className="text-[10px] text-slate-400">Snapshot at share time</p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <ul className="space-y-1">
                {flow.steps.map((s, i) => (
                  <li
                    key={i}
                    className={clsx(
                      "rounded-lg border-l-[3px] bg-slate-50/70 px-2.5 py-1.5",
                      s.status === "success" ? "border-l-emerald-400" : "border-l-red-400",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-slate-700">{s.step}</span>
                      <span
                        className={clsx(
                          "shrink-0 text-[10px] font-bold",
                          s.status === "success" ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {s.ms}ms
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-slate-400">
                      {s.from} → {s.to}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
