"use client";

import clsx from "clsx";
import { ScrollText } from "lucide-react";
import type { ExecutionStep } from "@/lib/types";

export default function EventLog({ log }: { log: ExecutionStep[] }) {
  return (
    <div className="z-10 flex h-full w-[320px] shrink-0 flex-col border-l border-border bg-white/95 shadow-lg backdrop-blur">
      <div className="flex items-center gap-1.5 border-b border-border px-3.5 py-2.5">
        <ScrollText size={13} className="text-slate-400" />
        <h2 className="text-xs font-bold text-slate-700">Execution Log</h2>
        <span className="ml-auto text-[10px] text-slate-400">{log.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {log.length === 0 ? (
          <p className="px-1.5 py-4 text-center text-[11px] text-slate-400">
            Trigger a scenario to see live trace steps.
          </p>
        ) : (
          <ul className="space-y-1">
            {log.map((step) => (
              <li
                key={`${step.id}-${step.timestamp}`}
                className={clsx(
                  "animate-fade-in-up rounded-lg border-l-[3px] bg-slate-50/70 px-2.5 py-1.5",
                  step.status === "success" ? "border-l-emerald-400" : "border-l-red-400",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-semibold text-slate-700">{step.stepName}</span>
                  <span
                    className={clsx(
                      "shrink-0 text-[10px] font-bold",
                      step.status === "success" ? "text-emerald-500" : "text-red-500",
                    )}
                  >
                    {step.latencyMs}ms
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[10px] text-slate-400">
                  {step.fromNode} → {step.toNode}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
