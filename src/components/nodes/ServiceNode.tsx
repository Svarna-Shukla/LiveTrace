"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlertTriangle, Database, Globe, KeyRound, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ServiceIcon, ServiceNodeData } from "@/lib/topology";
import { getSpeedTier, TIER_COLOR } from "@/lib/latencyTiers";
import StatusBadge from "./StatusBadge";
import clsx from "clsx";

const ICONS: Record<ServiceIcon, LucideIcon> = {
  globe: Globe,
  shield: ShieldCheck,
  key: KeyRound,
  database: Database,
};

const ICON_STYLES: Record<ServiceIcon, string> = {
  globe: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800",
  shield: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800",
  key: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  database: "bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800",
};

const RING_STYLES: Record<ServiceNodeData["status"], string> = {
  idle: "ring-0",
  running: "ring-2 ring-blue-300/70 shadow-blue-200/60 dark:ring-blue-400 dark:shadow-blue-500/50",
  success: "ring-2 ring-emerald-300/70 shadow-emerald-200/60 dark:ring-emerald-400 dark:shadow-emerald-500/50",
  error: "ring-2 ring-red-300/70 shadow-red-200/60 dark:ring-red-400 dark:shadow-red-500/50",
};

function ServiceNode({ data, selected }: NodeProps & { data: ServiceNodeData }) {
  const Icon = ICONS[data.icon];

  const tier =
    typeof data.lastLatency === "number" && data.status !== "idle" ? getSpeedTier(data.lastLatency) : null;
  const isBottleneck = tier === "slow" && (data.status === "running" || data.status === "success");

  return (
    <div
      className={clsx(
        "w-[240px] cursor-pointer rounded-xl border bg-white shadow-md transition-shadow duration-300",
        "border-slate-200 dark:border-slate-700 dark:bg-slate-900",
        selected
          ? "ring-2 ring-slate-400/70 dark:ring-slate-500"
          : isBottleneck
            ? "ring-2 ring-orange-400 shadow-orange-300/70 dark:shadow-orange-500/50"
            : RING_STYLES[data.status],
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-400 !bg-white dark:!border-slate-500 dark:!bg-slate-800"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-400 !bg-white dark:!border-slate-500 dark:!bg-slate-800"
      />

      <div className="flex items-center gap-2.5 border-b border-border px-3 py-2.5 dark:border-slate-800">
        <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", ICON_STYLES[data.icon])}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-slate-800 dark:text-slate-100">{data.label}</div>
          <div className="truncate text-[11px] text-slate-400 dark:text-slate-500">{data.subtitle}</div>
        </div>
      </div>

      <div className="flex min-h-[38px] items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {data.lastStep ?? "Waiting for activity…"}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {typeof data.lastLatency === "number" && data.status !== "idle" && (
            <span
              className="text-[10px] font-semibold"
              style={{ color: tier ? TIER_COLOR[tier] : undefined }}
            >
              {data.lastLatency}ms
            </span>
          )}
          <StatusBadge status={data.status} overrideLabel={data.badgeLabel} />
        </div>
      </div>

      {isBottleneck && (
        <div className="flex items-center gap-1.5 rounded-b-xl border-t border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-600 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400">
          <AlertTriangle size={12} className="shrink-0 animate-pulse" />
          Slow Node (+{data.lastLatency}ms)
        </div>
      )}
    </div>
  );
}

export default memo(ServiceNode);
