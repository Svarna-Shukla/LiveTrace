"use client";

import clsx from "clsx";
import { Activity, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { SCENARIOS, type FlowScenario } from "@/lib/types";

interface ControlPanelProps {
  connected: boolean;
  running: boolean;
  currentScenario: FlowScenario | null;
  onTrigger: (scenario: FlowScenario) => void;
  onReset: () => void;
}

export default function ControlPanel({ connected, running, currentScenario, onTrigger, onReset }: ControlPanelProps) {
  return (
    <div className="z-10 flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-border bg-white/95 p-3.5 shadow-lg backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-slate-800">LiveTrace</h1>
          <p className="text-[11px] text-slate-400">Real-time execution visualizer</p>
        </div>
        <div
          className={clsx(
            "flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold",
            connected ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-red-200 bg-red-50 text-red-500",
          )}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? "Live" : "Offline"}
        </div>
      </div>

      <div className="space-y-1.5">
        {SCENARIOS.map((scenario) => {
          const isActive = running && currentScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onTrigger(scenario.id)}
              disabled={running || !connected}
              className={clsx(
                "group w-full rounded-lg border px-3 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "border-blue-300 bg-blue-50"
                  : "border-border bg-white hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    scenario.tone === "success" ? "bg-emerald-400" : "bg-red-400",
                  )}
                />
                <span className="text-xs font-semibold text-slate-700">{scenario.label}</span>
                {isActive && <Activity size={11} className="ml-auto animate-pulse text-blue-500" />}
              </div>
              <p className="mt-0.5 pl-3.5 text-[10.5px] leading-snug text-slate-400">{scenario.description}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onReset}
        disabled={running}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCcw size={12} />
        Reset Canvas
      </button>
    </div>
  );
}
