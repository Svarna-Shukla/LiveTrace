import type { AuditReport, AuditSeverity } from "./codeAudit";

export interface ReportMeta {
  generatedAt: Date;
  graphLabel: string;
}

const SEVERITY_SECTIONS: Array<{ title: string; severity: AuditSeverity }> = [
  { title: "Critical", severity: "critical" },
  { title: "Warning", severity: "warning" },
  { title: "Optimization", severity: "optimization" },
];

export function buildMarkdownReport(report: AuditReport, meta: ReportMeta): string {
  const lines: string[] = [];

  lines.push("# LiveTrace Health & Performance Report");
  lines.push("");
  lines.push(`**Generated:** ${meta.generatedAt.toLocaleString()}  `);
  lines.push(`**Graph:** ${meta.graphLabel}`);
  lines.push("");
  lines.push(`## Overall System Health Score: ${report.healthScore}/100`);
  lines.push("");
  lines.push("## End-to-End Latency Breakdown");
  lines.push("");
  lines.push("| Node | Latency | Tier |");
  lines.push("|---|---|---|");
  for (const row of report.latencyRows) {
    lines.push(
      `| ${row.label} | ${row.latencyMs !== null ? `${row.latencyMs}ms` : "—"} | ${row.tier ?? "—"} |`,
    );
  }
  lines.push("");
  lines.push("## Findings");

  for (const { title, severity } of SEVERITY_SECTIONS) {
    const items = report.findings.filter((f) => f.severity === severity);
    lines.push("");
    lines.push(`### ${title} (${items.length})`);
    if (items.length === 0) {
      lines.push("");
      lines.push("_None found._");
      continue;
    }
    for (const f of items) {
      lines.push("");
      lines.push(`- **${f.title}** _(${f.category})_`);
      lines.push(`  - ${f.description}`);
      lines.push(`  - **Fix:** ${f.recommendation}`);
    }
  }

  if (!report.hasSource) {
    lines.push("");
    lines.push(
      "> No custom source code is loaded, so security/logic findings aren't available — only latency data for the current topology is shown. Upload code via \"Upload / Paste Codebase\" for a full audit.",
    );
  }

  return lines.join("\n");
}

export function downloadMarkdownReport(report: AuditReport, meta: ReportMeta): void {
  const markdown = buildMarkdownReport(report, meta);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "livetrace-audit-report.md";
  link.click();
  URL.revokeObjectURL(url);
}
