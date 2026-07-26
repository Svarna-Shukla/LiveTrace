export interface LoadTestSample {
  endpoint: string;
  latencyMs: number;
  outcome: "success" | "error";
}

export interface LoadTestBottleneck {
  endpoint: string;
  avgLatencyMs: number;
  requestCount: number;
}

export interface LoadTestSummary {
  rate: number;
  durationMs: number;
  totalRequests: number;
  actualReqPerSec: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  errorCount: number;
  errorRate: number;
  bottlenecks: LoadTestBottleneck[];
  generatedAt: Date;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

/** Aggregates raw load-test samples (collected while the generator was
 * running) into the headline stats + slowest-endpoints breakdown used by
 * the downloadable report. */
export function summarizeLoadTest(samples: LoadTestSample[], rate: number, durationMs: number): LoadTestSummary {
  const totalRequests = samples.length;
  const latencies = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
  const avgLatencyMs = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p99LatencyMs = Math.round(percentile(latencies, 99));
  const errorCount = samples.filter((s) => s.outcome === "error").length;
  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
  const actualReqPerSec = durationMs > 0 ? Math.round((totalRequests / durationMs) * 1000 * 10) / 10 : 0;

  const byEndpoint = new Map<string, number[]>();
  for (const sample of samples) {
    const list = byEndpoint.get(sample.endpoint) ?? [];
    list.push(sample.latencyMs);
    byEndpoint.set(sample.endpoint, list);
  }
  const bottlenecks: LoadTestBottleneck[] = Array.from(byEndpoint.entries())
    .map(([endpoint, list]) => ({
      endpoint,
      avgLatencyMs: Math.round(list.reduce((a, b) => a + b, 0) / list.length),
      requestCount: list.length,
    }))
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 5);

  return {
    rate,
    durationMs,
    totalRequests,
    actualReqPerSec,
    avgLatencyMs,
    p99LatencyMs,
    errorCount,
    errorRate,
    bottlenecks,
    generatedAt: new Date(),
  };
}

export function buildLoadTestReportMarkdown(summary: LoadTestSummary): string {
  const lines: string[] = [];

  lines.push("# LiveTrace Synthetic Load Test Report");
  lines.push("");
  lines.push(`**Generated:** ${summary.generatedAt.toLocaleString()}  `);
  lines.push(`**Target Rate:** ${summary.rate} req/s  `);
  lines.push(`**Duration:** ${(summary.durationMs / 1000).toFixed(1)}s`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Value |");
  lines.push("|---|---|");
  lines.push(`| Total Requests Simulated | ${summary.totalRequests} |`);
  lines.push(`| Actual Throughput | ${summary.actualReqPerSec} req/sec |`);
  lines.push(`| Average Latency | ${summary.avgLatencyMs}ms |`);
  lines.push(`| p99 Latency | ${summary.p99LatencyMs}ms |`);
  lines.push(`| Error Rate | ${(summary.errorRate * 100).toFixed(1)}% (${summary.errorCount} failed) |`);
  lines.push("");
  lines.push("## Bottleneck Endpoints Detected");
  lines.push("");
  if (summary.bottlenecks.length === 0) {
    lines.push("_No requests were recorded during this run._");
  } else {
    lines.push("| Endpoint | Avg Latency | Requests |");
    lines.push("|---|---|---|");
    for (const b of summary.bottlenecks) {
      lines.push(`| ${b.endpoint} | ${b.avgLatencyMs}ms | ${b.requestCount} |`);
    }
  }

  return lines.join("\n");
}

export function downloadLoadTestReport(summary: LoadTestSummary): void {
  const markdown = buildLoadTestReportMarkdown(summary);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "livetrace-load-test-report.md";
  link.click();
  URL.revokeObjectURL(url);
}
