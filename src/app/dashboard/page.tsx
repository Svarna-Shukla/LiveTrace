"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import {
  Activity,
  Check,
  Copy,
  Gauge,
  Layers,
  Loader2,
  Moon,
  Pencil,
  Plus,
  ShieldCheck,
  Sun,
  Trash2,
  UserCircle2,
  X,
  Zap,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import AuthModal from "@/components/AuthModal";
import TiltCard from "@/components/TiltCard";

interface WorkflowSummary {
  id: string;
  name: string;
  nodeCount: number;
  healthScore: number | null;
  latencyScore: number | null;
  createdAt: string;
  updatedAt: string;
}

function scoreBadge(score: number | null) {
  if (score === null) return "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";
  if (score >= 80) return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (score >= 50) return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function WorkflowCard({
  workflow,
  onRename,
  onDuplicate,
  onDelete,
}: {
  workflow: WorkflowSummary;
  onRename: (id: string, name: string) => Promise<void>;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(workflow.name);
  const [savingName, setSavingName] = useState(false);
  const [busyAction, setBusyAction] = useState<"duplicate" | "delete" | null>(null);

  const submitRename = async () => {
    if (!name.trim() || name.trim() === workflow.name) {
      setRenaming(false);
      setName(workflow.name);
      return;
    }
    setSavingName(true);
    await onRename(workflow.id, name.trim());
    setSavingName(false);
    setRenaming(false);
  };

  return (
    <TiltCard className="border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-start justify-between gap-2">
        {renaming ? (
          <div className="flex flex-1 items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
              className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[13px] font-semibold text-slate-800 outline-none focus:border-violet-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              onClick={submitRename}
              disabled={savingName}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              {savingName ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button
              onClick={() => {
                setRenaming(false);
                setName(workflow.name);
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <Link
            href={`/canvas?workflow=${workflow.id}`}
            className="flex-1 truncate text-[13.5px] font-bold text-slate-800 hover:text-violet-600 dark:text-slate-100 dark:hover:text-violet-400"
          >
            {workflow.name}
          </Link>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <Layers size={10} />
          {workflow.nodeCount} nodes
        </span>
        <span className={clsx("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", scoreBadge(workflow.healthScore))}>
          <ShieldCheck size={10} />
          {workflow.healthScore ?? "—"}
        </span>
        <span className={clsx("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", scoreBadge(workflow.latencyScore))}>
          <Gauge size={10} />
          {workflow.latencyScore ?? "—"}
        </span>
      </div>

      <p className="mb-3 text-[10.5px] text-slate-400">Last edited {formatDate(workflow.updatedAt)}</p>

      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Link
          href={`/canvas?workflow=${workflow.id}`}
          className="flex-1 rounded-lg bg-slate-900 py-1.5 text-center text-[11px] font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500"
        >
          Open
        </Link>
        <button
          onClick={() => setRenaming(true)}
          title="Rename"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => {
            setBusyAction("duplicate");
            onDuplicate(workflow.id);
          }}
          title="Duplicate"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {busyAction === "duplicate" ? <Loader2 size={12} className="animate-spin" /> : <Copy size={12} />}
        </button>
        <button
          onClick={() => {
            if (window.confirm(`Delete "${workflow.name}"? This can't be undone.`)) {
              setBusyAction("delete");
              onDelete(workflow.id);
            }
          }}
          title="Delete"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          {busyAction === "delete" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      </div>
    </TiltCard>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const loadWorkflows = useCallback(() => {
    setLoading(true);
    fetch("/api/workflows")
      .then((res) => (res.ok ? res.json() : { workflows: [] }))
      .then((data) => setWorkflows(data.workflows ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadWorkflows();
    else if (status === "unauthenticated") setLoading(false);
  }, [status, loadWorkflows]);

  const handleRename = useCallback(async (id: string, name: string) => {
    const res = await fetch(`/api/workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, name: data.workflow.name } : w)));
    }
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    const res = await fetch(`/api/workflows/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setWorkflows((prev) => [data.workflow, ...prev]);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    if (res.ok) setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-canvas dark:bg-slate-950">
        <Loader2 size={22} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-canvas dark:bg-slate-950">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-violet-600">
          <UserCircle2 size={22} />
        </div>
        <div className="text-center">
          <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">Sign in to view your dashboard</h1>
          <p className="mt-1 text-[12px] text-slate-400">Your saved workflows live in your account.</p>
        </div>
        <button
          onClick={() => setAuthOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500"
        >
          Sign In / Register
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={loadWorkflows} />
      </div>
    );
  }

  const totalWorkflows = workflows.length;
  const avgLatency = average(workflows.map((w) => w.latencyScore));
  const avgHealth = average(workflows.map((w) => w.healthScore));

  return (
    <div className="min-h-screen bg-canvas dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-violet-600">
            <Zap size={16} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">Dashboard</div>
            <div className="text-[10.5px] text-slate-400">{session?.user?.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <Link
            href="/canvas"
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-[12.5px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            <Plus size={14} />
            New Workflow
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              <Layers size={12} />
              Saved Workflows
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-800 dark:text-slate-100">{totalWorkflows}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              <Activity size={12} />
              Avg Latency Score
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-800 dark:text-slate-100">{avgLatency ?? "—"}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
              <ShieldCheck size={12} />
              Security Health Rating
            </div>
            <div className="mt-1.5 text-2xl font-bold text-slate-800 dark:text-slate-100">{avgHealth ?? "—"}</div>
          </div>
        </div>

        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
            <Layers size={24} className="text-slate-300 dark:text-slate-600" />
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">No saved workflows yet</p>
            <Link
              href="/canvas"
              className="mt-1 flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500"
            >
              <Plus size={14} />
              Create Code Workflow
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((w) => (
              <WorkflowCard
                key={w.id}
                workflow={w}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
