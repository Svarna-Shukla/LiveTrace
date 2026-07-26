"use client";

import clsx from "clsx";
import { Database, Download, Gauge, Loader2, Lock, Square, ShieldCheck, Zap } from "lucide-react";
import type { DynamicScenario } from "@/lib/codeParser";

interface DynamicScenarioToolbarProps {
  scenarios: DynamicScenario[];
  activeScenarioId: string | null;
  disabled: boolean;
  onRunScenario: (scenario: DynamicScenario) => void;
  loadTestActive: boolean;
  loadTestRate: number;
  onStartLoadTest: (rate: number) => void;
  onStopLoadTest: () => void;
  onChangeLoadTestRate: (rate: number) => void;
  hasLoadTestReport: boolean;
  onDownloadLoadTestReport: () => void;
}

function scenarioStyle(scenario: DynamicScenario) {
  if (scenario.kind === "success") {
    return {
      icon: ShieldCheck,
      active:
        "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      idle:
        "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/50",
    };
  }
  if (scenario.label.startsWith("Trigger")) {
    return {
      icon: Database,
      active:
        "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
      idle:
        "border-slate-200 bg-white text-slate-700 hover:border-amber-200 hover:bg-amber-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-700 dark:hover:bg-amber-950/50",
    };
  }
  return {
    icon: Lock,
    active: "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300",
    idle:
      "border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-700 dark:hover:bg-red-950/50",
  };
}

export default function DynamicScenarioToolbar({
  scenarios,
  activeScenarioId,
  disabled,
  onRunScenario,
  loadTestActive,
  loadTestRate,
  onStartLoadTest,
  onStopLoadTest,
  onChangeLoadTestRate,
  hasLoadTestReport,
  onDownloadLoadTestReport,
}: DynamicScenarioToolbarProps) {
  const loadTestControlsDisabled = disabled && !loadTestActive;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-2">
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <span className="pl-2 pr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Detected Scenarios
        </span>

        {scenarios.length === 0 ? (
          <span className="px-2 py-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            No routes detected in this file
          </span>
        ) : (
          scenarios.map((scenario) => {
            const { icon: Icon, active, idle } = scenarioStyle(scenario);
            const isActive = activeScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => onRunScenario(scenario)}
                disabled={disabled}
                title={`${scenario.method} ${scenario.path}`}
                className={clsx(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
                  isActive ? active : idle,
                )}
              >
                {isActive ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
                {scenario.label}
              </button>
            );
          })
        )}

        <div className="mx-0.5 h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />

        <div
          className={clsx(
            "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
            loadTestActive
              ? "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300"
              : "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
          )}
        >
          <Gauge size={14} className={loadTestActive ? "animate-pulse" : undefined} />
          <span>Load Test</span>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={loadTestRate}
            onChange={(e) => onChangeLoadTestRate(Number(e.target.value))}
            disabled={loadTestControlsDisabled}
            className="h-1.5 w-24 cursor-pointer accent-orange-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-28"
          />
          <span className="w-14 shrink-0 tabular-nums text-[11px] text-slate-500 dark:text-slate-400">
            {loadTestRate} req/s
          </span>
          <button
            onClick={() => (loadTestActive ? onStopLoadTest() : onStartLoadTest(loadTestRate))}
            disabled={loadTestControlsDisabled}
            className={clsx(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              loadTestActive
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-slate-900 text-white hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500",
            )}
            title={loadTestActive ? "Stop load test" : "Start load test"}
          >
            {loadTestActive ? <Square size={11} fill="currentColor" /> : <Zap size={12} />}
          </button>
        </div>

        {!loadTestActive && hasLoadTestReport && (
          <button
            onClick={onDownloadLoadTestReport}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
          >
            <Download size={14} />
            Download Load Test Report
          </button>
        )}
      </div>
    </div>
  );
}
