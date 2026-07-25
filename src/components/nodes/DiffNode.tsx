"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Check, Database, Globe, Minus, Pencil, Plus, ShieldCheck, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { ServiceIcon } from "@/lib/topology";
import type { DiffNodeData, DiffStatus } from "@/lib/architectureDiff";

const ICONS: Record<ServiceIcon, LucideIcon> = {
  globe: Globe,
  shield: ShieldCheck,
  key: Database,
  database: Database,
};

const STATUS_META: Record<DiffStatus, { icon: LucideIcon; border: string; badge: string; label: string }> = {
  added: {
    icon: Plus,
    border: "border-emerald-400 dark:border-emerald-500",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    label: "Added",
  },
  removed: {
    icon: Minus,
    border: "border-red-400 dark:border-red-500",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    label: "Removed",
  },
  modified: {
    icon: Pencil,
    border: "border-amber-400 dark:border-amber-500",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    label: "Modified",
  },
  unchanged: {
    icon: Check,
    border: "border-slate-200 dark:border-slate-700",
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    label: "Unchanged",
  },
};

function DiffNode({ data }: NodeProps & { data: DiffNodeData }) {
  const Icon = ICONS[data.icon];
  const meta = STATUS_META[data.status];
  const StatusIcon = meta.icon;

  return (
    <div className={clsx("w-[320px] rounded-xl border-2 bg-white shadow-md dark:bg-slate-900", meta.border)}>
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Icon size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-slate-800 dark:text-slate-100">{data.label}</div>
          <div className="truncate text-[10.5px] text-slate-400 dark:text-slate-500">{data.subtitle}</div>
        </div>
        <span
          className={clsx(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase",
            meta.badge,
          )}
        >
          <StatusIcon size={9} />
          {meta.label}
        </span>
      </div>
      <div className="px-3 py-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{data.detail}</div>
    </div>
  );
}

export default memo(DiffNode);
