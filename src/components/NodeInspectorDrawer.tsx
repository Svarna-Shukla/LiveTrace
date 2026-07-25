"use client";

import clsx from "clsx";
import { Database, Globe, KeyRound, ShieldCheck, X, type LucideIcon } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { ServiceIcon, ServiceNodeData } from "@/lib/topology";
import type { NodeActivityEntry } from "@/lib/types";
import StatusBadge from "./nodes/StatusBadge";

const ICONS: Record<ServiceIcon, LucideIcon> = {
  globe: Globe,
  shield: ShieldCheck,
  key: KeyRound,
  database: Database,
};

interface NodeInspectorDrawerProps {
  node: Node<ServiceNodeData> | null;
  activity: NodeActivityEntry[];
  onClose: () => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function NodeInspectorDrawer({ node, activity, onClose }: NodeInspectorDrawerProps) {
  const isOpen = node !== null;
  const Icon = node ? ICONS[node.data.icon] : Globe;
  const latest = activity[0];

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-30 bg-slate-900/10 backdrop-blur-[1px] transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "fixed inset-y-0 right-0 z-40 flex w-[360px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {node && (
          <>
            <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{node.data.label}</div>
                <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">{node.data.subtitle}</div>
              </div>
              <button
                onClick={onClose}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Status
                </span>
                <StatusBadge status={node.data.status} overrideLabel={node.data.badgeLabel} />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Latency
                </span>{" "}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {typeof node.data.lastLatency === "number" ? `${node.data.lastLatency}ms` : "—"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3.5">
              <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Live JSON Payload
              </h3>
              <pre className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-300 dark:border-slate-700">
                {latest ? JSON.stringify(latest.payload, null, 2) : "// waiting for activity…"}
              </pre>

              <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Status Logs
              </h3>
              {activity.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                  No activity recorded for this node yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {activity.map((entry) => (
                    <li
                      key={`${entry.id}-${entry.timestamp}`}
                      className={clsx(
                        "rounded-lg border-l-[3px] bg-slate-50/70 px-2.5 py-1.5 dark:bg-slate-900/70",
                        entry.status === "success" ? "border-l-emerald-400" : "border-l-red-400",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                          {entry.stepName}
                        </span>
                        <span
                          className={clsx(
                            "shrink-0 text-[10px] font-bold",
                            entry.status === "success" ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
                          )}
                        >
                          {entry.latencyMs}ms
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="truncate">
                          {entry.fromNode} → {entry.toNode}
                        </span>
                        <span className="shrink-0">{formatTime(entry.timestamp)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
