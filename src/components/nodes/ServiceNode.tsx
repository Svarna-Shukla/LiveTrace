"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Database, Globe, KeyRound, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ServiceIcon, ServiceNodeData } from "@/lib/topology";
import StatusBadge from "./StatusBadge";
import clsx from "clsx";

const ICONS: Record<ServiceIcon, LucideIcon> = {
  globe: Globe,
  shield: ShieldCheck,
  key: KeyRound,
  database: Database,
};

const ICON_STYLES: Record<ServiceIcon, string> = {
  globe: "bg-sky-50 text-sky-600 border-sky-200",
  shield: "bg-violet-50 text-violet-600 border-violet-200",
  key: "bg-amber-50 text-amber-600 border-amber-200",
  database: "bg-teal-50 text-teal-600 border-teal-200",
};

const RING_STYLES: Record<ServiceNodeData["status"], string> = {
  idle: "ring-0",
  running: "ring-2 ring-blue-300/70 shadow-blue-200/60",
  success: "ring-2 ring-emerald-300/70 shadow-emerald-200/60",
  error: "ring-2 ring-red-300/70 shadow-red-200/60",
};

function ServiceNode({ data, selected }: NodeProps & { data: ServiceNodeData }) {
  const Icon = ICONS[data.icon];

  return (
    <div
      className={clsx(
        "w-[240px] cursor-pointer rounded-xl border bg-white shadow-md transition-shadow duration-300",
        "border-slate-200",
        selected ? "ring-2 ring-slate-400/70" : RING_STYLES[data.status],
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-400 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-400 !bg-white"
      />

      <div className="flex items-center gap-2.5 border-b border-border px-3 py-2.5">
        <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", ICON_STYLES[data.icon])}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-slate-800">{data.label}</div>
          <div className="truncate text-[11px] text-slate-400">{data.subtitle}</div>
        </div>
      </div>

      <div className="flex min-h-[38px] items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-[11px] text-slate-500">
          {data.lastStep ?? "Waiting for activity…"}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {typeof data.lastLatency === "number" && data.status !== "idle" && (
            <span className="text-[10px] font-medium text-slate-400">{data.lastLatency}ms</span>
          )}
          <StatusBadge status={data.status} overrideLabel={data.badgeLabel} />
        </div>
      </div>
    </div>
  );
}

export default memo(ServiceNode);
