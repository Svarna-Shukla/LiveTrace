"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  GitCompare,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  RotateCcw,
  Save,
  ScrollText,
  Share2,
  Sparkles,
  Sun,
  UploadCloud,
  UserCircle2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface TopNavBarProps {
  connected: boolean;
  customGraphActive: boolean;
  disabled: boolean;
  onOpenIngest: () => void;
  onLoadDemo: () => void;
  onShare: () => void;
  onAudit: () => void;
  onCompareArchitecture: () => void;
  onToggleSidebar: () => void;
  onToggleLog: () => void;
  userLabel?: string | null;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  onSaveWorkflow?: () => void;
  saving?: boolean;
}

export default function TopNavBar({
  connected,
  customGraphActive,
  disabled,
  onOpenIngest,
  onLoadDemo,
  onShare,
  onAudit,
  onCompareArchitecture,
  onToggleSidebar,
  onToggleLog,
  userLabel,
  onOpenAuth,
  onSignOut,
  onSaveWorkflow,
  saving,
}: TopNavBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="z-30 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-y-2 border-b border-slate-200 bg-white px-2.5 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <button
          onClick={onToggleSidebar}
          title="Toggle Explorer / Scenarios panel"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu size={16} />
        </button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-violet-600">
          <Zap size={16} />
        </div>
        <div className="hidden leading-tight sm:block">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">LiveTrace</div>
          <div className="hidden text-[10.5px] text-slate-400 dark:text-slate-500 sm:block">
            Real-time execution visualizer
          </div>
        </div>
        <div
          title={
            connected
              ? "Connected to the live Socket.IO server"
              : "No live server connection — running fully client-side, all features still work"
          }
          className={clsx(
            "ml-1 flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold sm:ml-2",
            connected
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
              : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
          )}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span className="hidden sm:inline">{connected ? "Live" : "Local Mode"}</span>
        </div>
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? <Moon size={13} /> : <Sun size={13} />}
        </button>
        {customGraphActive && (
          <span className="hidden rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-600 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400 sm:inline-flex">
            Custom graph
          </span>
        )}
        <button
          onClick={onToggleLog}
          title="Toggle Execution Log"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
        >
          <ScrollText size={16} />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {customGraphActive && (
          <button
            onClick={onLoadDemo}
            disabled={disabled}
            title="Load Demo Topology"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-3"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Load Demo Topology</span>
          </button>
        )}
        <button
          onClick={onCompareArchitecture}
          title="Compare Architecture"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-3"
        >
          <GitCompare size={13} />
          <span className="hidden sm:inline">Compare Architecture</span>
        </button>
        <button
          onClick={onShare}
          title="Share Diagram"
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-3"
        >
          <Share2 size={13} />
          <span className="hidden sm:inline">Share Diagram</span>
        </button>
        {onSaveWorkflow && (
          <button
            onClick={onSaveWorkflow}
            disabled={disabled || saving}
            title="Save Workflow"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900 sm:px-3"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span className="hidden sm:inline">Save Workflow</span>
          </button>
        )}
        <button
          onClick={onAudit}
          title="AI Code Audit"
          className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900 sm:px-3"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">AI Code Audit</span>
        </button>
        <button
          onClick={onOpenIngest}
          disabled={disabled}
          title="Upload / Paste Codebase"
          className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-500 sm:px-3"
        >
          <UploadCloud size={14} />
          <span className="hidden sm:inline">Upload / Paste Codebase</span>
        </button>

        {userLabel ? (
          <div className="flex items-center gap-1.5">
            <Link
              href="/dashboard"
              title="Dashboard"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LayoutDashboard size={14} />
            </Link>
            <button
              onClick={onSignOut}
              title={`Sign out (${userLabel})`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-3"
            >
              <UserCircle2 size={13} />
              <span className="hidden sm:inline">Sign In / Register</span>
            </button>
          )
        )}
      </div>
    </header>
  );
}
