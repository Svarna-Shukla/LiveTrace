"use client";

import clsx from "clsx";
import { Moon, RotateCcw, Share2, Sparkles, Sun, UploadCloud, Wifi, WifiOff, Zap } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface TopNavBarProps {
  connected: boolean;
  customGraphActive: boolean;
  disabled: boolean;
  onOpenIngest: () => void;
  onLoadDemo: () => void;
  onShare: () => void;
  onAudit: () => void;
}

export default function TopNavBar({
  connected,
  customGraphActive,
  disabled,
  onOpenIngest,
  onLoadDemo,
  onShare,
  onAudit,
}: TopNavBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-violet-600">
          <Zap size={16} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">LiveTrace</div>
          <div className="text-[10.5px] text-slate-400 dark:text-slate-500">Real-time execution visualizer</div>
        </div>
        <div
          title={
            connected
              ? "Connected to the live Socket.IO server"
              : "No live server connection — running fully client-side, all features still work"
          }
          className={clsx(
            "ml-2 flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold",
            connected
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
              : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
          )}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? "Live" : "Local Mode"}
        </div>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? <Moon size={13} /> : <Sun size={13} />}
        </button>
        {customGraphActive && (
          <span className="ml-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-600 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400">
            Custom graph
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {customGraphActive && (
          <button
            onClick={onLoadDemo}
            disabled={disabled}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw size={13} />
            Load Demo Topology
          </button>
        )}
        <button
          onClick={onShare}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Share2 size={13} />
          Share Diagram
        </button>
        <button
          onClick={onAudit}
          className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900"
        >
          <Sparkles size={13} />
          AI Code Audit
        </button>
        <button
          onClick={onOpenIngest}
          disabled={disabled}
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-500"
        >
          <UploadCloud size={14} />
          Upload / Paste Codebase
        </button>
      </div>
    </header>
  );
}
