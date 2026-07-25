"use client";

import { useMemo } from "react";
import clsx from "clsx";
import type { Node } from "@xyflow/react";
import {
  AlertOctagon,
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { runCodeAudit, type AuditFinding, type AuditSeverity } from "@/lib/codeAudit";
import { downloadMarkdownReport } from "@/lib/reportGenerator";
import { TIER_COLOR, TIER_LABEL } from "@/lib/latencyTiers";
import type { ServiceNodeData } from "@/lib/topology";
import type { NodeActivityEntry } from "@/lib/types";

interface AiAuditModalProps {
  open: boolean;
  onClose: () => void;
  sourceCode: string | null;
  nodes: Node<ServiceNodeData>[];
  nodeActivity: Record<string, NodeActivityEntry[]>;
  graphLabel: string;
}

const SEVERITY_META: Record<
  AuditSeverity,
  { title: string; icon: typeof AlertOctagon; badgeClass: string; borderClass: string }
> = {
  critical: {
    title: "Critical",
    icon: AlertOctagon,
    badgeClass: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    borderClass: "border-l-red-400",
  },
  warning: {
    title: "Warning",
    icon: AlertTriangle,
    badgeClass: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    borderClass: "border-l-amber-400",
  },
  optimization: {
    title: "Optimization",
    icon: TrendingUp,
    badgeClass: "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800",
    borderClass: "border-l-sky-400",
  },
};

function healthScoreColor(score: number): string {
  if (score >= 80) return "#22C55E";
  if (score >= 50) return "#EAB308";
  return "#EF4444";
}

function FindingsBySeverity({ findings }: { findings: AuditFinding[] }) {
  return (
    <>
      {(Object.keys(SEVERITY_META) as AuditSeverity[]).map((severity) => {
        const meta = SEVERITY_META[severity];
        const Icon = meta.icon;
        const items = findings.filter((f) => f.severity === severity);
        return (
          <div key={severity} className="mb-4">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Icon size={13} className="dark:text-slate-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {meta.title} ({items.length})
              </h3>
            </div>
            {items.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                None found.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((f) => (
                  <li
                    key={f.id}
                    className={clsx("rounded-lg border-l-[3px] bg-slate-50/70 px-3 py-2 dark:bg-slate-800/70", meta.borderClass)}
                  >
                    <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{f.title}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                      {f.description}
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">Fix: </span>
                      {f.recommendation}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function AiAuditModal({
  open,
  onClose,
  sourceCode,
  nodes,
  nodeActivity,
  graphLabel,
}: AiAuditModalProps) {
  const report = useMemo(
    () => runCodeAudit(sourceCode, nodes, nodeActivity),
    [sourceCode, nodes, nodeActivity],
  );

  if (!open) return null;

  const scoreColor = healthScoreColor(report.healthScore);
  const generatedAt = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="animate-fade-in-up relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-violet-600">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Code Audit</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">{graphLabel} · automated static analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 text-lg font-bold"
              style={{ borderColor: scoreColor, color: scoreColor }}
            >
              {report.healthScore}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Overall System Health Score
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {report.findings.length} finding{report.findings.length === 1 ? "" : "s"} across security, logic, and
                performance.
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              End-to-End Latency Breakdown
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-[11.5px]">
                <thead className="bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <tr>
                    <th className="px-3 py-1.5 font-semibold">Node</th>
                    <th className="px-3 py-1.5 font-semibold">Latency</th>
                    <th className="px-3 py-1.5 font-semibold">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {report.latencyRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-1.5 text-slate-700 dark:text-slate-200">{row.label}</td>
                      <td className="px-3 py-1.5 text-slate-600 dark:text-slate-300">
                        {row.latencyMs !== null ? `${row.latencyMs}ms` : "—"}
                      </td>
                      <td className="px-3 py-1.5">
                        {row.tier ? (
                          <span className="font-semibold" style={{ color: TIER_COLOR[row.tier] }}>
                            {TIER_LABEL[row.tier]}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!report.hasSource && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                No custom source code is loaded, so security/logic findings aren&apos;t available — upload code via
                &quot;Upload / Paste Codebase&quot; for a full audit.
              </span>
            </div>
          )}

          <FindingsBySeverity findings={report.findings} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Uses your browser's print dialog — choose 'Save as PDF' as the destination"
          >
            <Printer size={14} />
            Print / Save as PDF
          </button>
          <button
            onClick={() => downloadMarkdownReport(report, { generatedAt, graphLabel })}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            <Download size={14} />
            Download Markdown Report
          </button>
        </div>
      </div>

      {/* Print-only version — unconstrained by the modal's scroll/height so the full report prints cleanly. */}
      <div className="livetrace-print-only px-8 py-8">
        <h1 className="text-xl font-bold text-slate-900">LiveTrace Health & Performance Report</h1>
        <p className="mt-1 text-xs text-slate-500">
          Generated {generatedAt.toLocaleString()} · {graphLabel}
        </p>
        <h2 className="mt-4 text-base font-bold text-slate-800">
          Overall System Health Score: {report.healthScore}/100
        </h2>

        <h2 className="mt-4 text-base font-bold text-slate-800">End-to-End Latency Breakdown</h2>
        <table className="mt-2 w-full border-collapse text-left text-xs">
          <thead>
            <tr>
              <th className="border border-slate-300 px-2 py-1">Node</th>
              <th className="border border-slate-300 px-2 py-1">Latency</th>
              <th className="border border-slate-300 px-2 py-1">Tier</th>
            </tr>
          </thead>
          <tbody>
            {report.latencyRows.map((row) => (
              <tr key={row.id}>
                <td className="border border-slate-300 px-2 py-1">{row.label}</td>
                <td className="border border-slate-300 px-2 py-1">{row.latencyMs !== null ? `${row.latencyMs}ms` : "—"}</td>
                <td className="border border-slate-300 px-2 py-1">{row.tier ? TIER_LABEL[row.tier] : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mt-4 text-base font-bold text-slate-800">Findings</h2>
        {(Object.keys(SEVERITY_META) as AuditSeverity[]).map((severity) => {
          const items = report.findings.filter((f) => f.severity === severity);
          return (
            <div key={severity} className="mt-2">
              <h3 className="text-sm font-bold text-slate-700">
                {SEVERITY_META[severity].title} ({items.length})
              </h3>
              {items.length === 0 ? (
                <p className="text-xs text-slate-500">None found.</p>
              ) : (
                <ul className="ml-4 list-disc">
                  {items.map((f) => (
                    <li key={f.id} className="mt-1 text-xs text-slate-700">
                      <strong>{f.title}</strong> ({f.category}) — {f.description} <em>Fix: {f.recommendation}</em>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {!report.hasSource && (
          <p className="mt-4 text-xs italic text-slate-500">
            No custom source code was loaded — security/logic findings are unavailable.
          </p>
        )}
      </div>
    </div>
  );
}
