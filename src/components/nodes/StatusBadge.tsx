"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { NodeStatus } from "@/lib/types";

export default function StatusBadge({ status, overrideLabel }: { status: NodeStatus; overrideLabel?: string }) {
  if (status === "idle") return null;

  const config: Record<Exclude<NodeStatus, "idle">, { className: string; icon: React.ReactNode; label: string }> = {
    running: {
      className: "bg-blue-50 text-blue-600 border-blue-200",
      icon: <Loader2 size={12} className="animate-spin" />,
      label: "Running",
    },
    success: {
      className: "bg-emerald-50 text-emerald-600 border-emerald-200",
      icon: <CheckCircle2 size={12} />,
      label: "Success",
    },
    error: {
      className: "bg-red-50 text-red-600 border-red-200",
      icon: <AlertCircle size={12} />,
      label: "Error",
    },
  };

  const { className, icon, label } = config[status];

  return (
    <span
      title={overrideLabel}
      className={`inline-flex max-w-[130px] items-center gap-1 truncate whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none animate-fade-in-up ${className}`}
    >
      {icon}
      <span className="truncate">{overrideLabel ?? label}</span>
    </span>
  );
}
