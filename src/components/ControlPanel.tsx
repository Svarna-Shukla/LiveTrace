"use client";

import clsx from "clsx";
import { Activity, RotateCcw } from "lucide-react";
import { SCENARIOS, type FlowScenario } from "@/lib/types";

interface ControlPanelProps {
  connected: boolean;
  running: boolean;
  currentScenario: FlowScenario | null;
  disabled?: boolean;
  onTrigger: (scenario: FlowScenario) => void;
  onReset: () => void;
}

export default function ControlPanel({
  connected,
  running,
  currentScenario,
  disabled,
  onTrigger,
  onReset,
}: ControlPanelProps) {
  const scenariosDisabled = running || disabled;

  return (
    <div className="z-10 flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-border bg-white/95 p-3.5 shadow-lg backdrop-blur">
      <div className="mb-3">
        <h2 className="text-xs font-bold text-slate-700">Scenarios</h2>
        <p className="text-[10.5px] text-slate-400">
          {disabled
            ? "Unavailable while a custom graph is loaded."
            : connected
              ? "Server-driven demo flows"
              : "Local mode — running client-side"}
        </p>
      </div>

      <div className="space-y-1.5">
        {SCENARIOS.map((scenario) => {
          const isActive = running && currentScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onTrigger(scenario.id)}
              disabled={scenariosDisabled}
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
