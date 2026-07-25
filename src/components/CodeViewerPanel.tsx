"use client";

import { FileCode2, Info } from "lucide-react";
import { highlightCode } from "@/lib/highlight";
import type { FileGraphEntry } from "@/lib/multiFile";

interface CodeViewerPanelProps {
  entry: FileGraphEntry;
}

/**
 * Sleek read-only code viewer shown in place of the React Flow canvas when
 * the selected file has no detected API/env/DB signatures (isFlowchartReady
 * === false) — there's nothing meaningful to diagram, so we show the source
 * instead of an empty canvas.
 */
export default function CodeViewerPanel({ entry }: CodeViewerPanelProps) {
  const lines = entry.file.content.split("\n");

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2.5">
        <FileCode2 size={14} className="shrink-0 text-slate-400" />
        <span className="truncate font-mono text-[12px] text-slate-300">{entry.file.path}</span>
        <span className="ml-auto shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
          📄 Code
        </span>
      </div>

      <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-amber-800/40 bg-amber-950/30 px-3 py-2 text-[11.5px] text-amber-300">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>No active API, .env, or DB traces detected in this file.</span>
      </div>

      <div className="flex-1 overflow-auto">
        <pre className="m-0 flex min-w-full font-mono text-[12.5px] leading-[1.6]">
          <code className="select-none whitespace-pre border-r border-slate-800 px-3 py-3 text-right text-slate-600">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </code>
          <code
            className="flex-1 whitespace-pre px-4 py-3 text-slate-200"
            dangerouslySetInnerHTML={{ __html: highlightCode(entry.file.content) }}
          />
        </pre>
      </div>
    </div>
  );
}
