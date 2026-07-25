"use client";

import clsx from "clsx";
import { RotateCcw, UploadCloud, Wifi, WifiOff, Zap } from "lucide-react";

interface TopNavBarProps {
  connected: boolean;
  customGraphActive: boolean;
  disabled: boolean;
  onOpenIngest: () => void;
  onLoadDemo: () => void;
}

export default function TopNavBar({ connected, customGraphActive, disabled, onOpenIngest, onLoadDemo }: TopNavBarProps) {
  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
          <Zap size={16} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-800">LiveTrace</div>
          <div className="text-[10.5px] text-slate-400">Real-time execution visualizer</div>
        </div>
        <div
          className={clsx(
            "ml-2 flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold",
            connected ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-red-200 bg-red-50 text-red-500",
          )}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? "Live" : "Offline"}
        </div>
        {customGraphActive && (
          <span className="ml-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-600">
            Custom graph
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {customGraphActive && (
          <button
            onClick={onLoadDemo}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={13} />
            Load Demo Topology
          </button>
        )}
        <button
          onClick={onOpenIngest}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadCloud size={14} />
          Upload / Paste Codebase
        </button>
      </div>
    </header>
  );
}
