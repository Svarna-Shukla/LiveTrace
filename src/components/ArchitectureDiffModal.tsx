"use client";

import { useMemo, useRef, useState } from "react";
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant } from "@xyflow/react";
import { FileUp, FolderUp, GitCompare, Loader2, Minus, Pencil, Plus, X } from "lucide-react";
import clsx from "clsx";
import { ingestAnyFiles } from "@/lib/ingestAny";
import type { IngestedFile } from "@/lib/ingestFilters";
import { computeArchitectureDiff, type ArchitectureDiffResult } from "@/lib/architectureDiff";
import DiffNode from "./nodes/DiffNode";

interface ArchitectureDiffModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCEPTED_EXTENSIONS = ".js,.jsx,.ts,.tsx,.json,.py,.go,.zip,.env";

interface PickerProps {
  label: string;
  accentClassName: string;
  files: IngestedFile[] | null;
  isLoading: boolean;
  onPick: (fileList: FileList | File[]) => void;
}

function FilePicker({ label, accentClassName, files, isLoading, onPick }: PickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/40">
      <div className={clsx("mb-2 text-[11px] font-bold uppercase tracking-wide", accentClassName)}>{label}</div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <FileUp size={12} />
          File
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          <FolderUp size={12} />
          Folder
        </button>
        {isLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onPick(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onPick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <p className="mt-2 truncate text-[11px] text-slate-500 dark:text-slate-400">
        {files === null
          ? "No files loaded yet."
          : `${files.length} file${files.length === 1 ? "" : "s"} loaded${files.length === 1 ? `: ${files[0].path}` : ""}`}
      </p>
    </div>
  );
}

const nodeTypes = { diff: DiffNode };

export default function ArchitectureDiffModal({ open, onClose }: ArchitectureDiffModalProps) {
  const [beforeFiles, setBeforeFiles] = useState<IngestedFile[] | null>(null);
  const [afterFiles, setAfterFiles] = useState<IngestedFile[] | null>(null);
  const [loadingSide, setLoadingSide] = useState<"before" | "after" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ArchitectureDiffResult | null>(null);

  if (!open) return null;

  const handlePick = async (side: "before" | "after", fileList: FileList | File[]) => {
    setLoadingSide(side);
    setError(null);
    try {
      const ingested = await ingestAnyFiles(fileList);
      if (ingested.fileCount === 0) {
        setError("No readable code files found in that upload.");
        return;
      }
      if (side === "before") setBeforeFiles(ingested.files);
      else setAfterFiles(ingested.files);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? `Couldn't read that upload: ${err.message}` : "Couldn't read that upload.");
    } finally {
      setLoadingSide(null);
    }
  };

  const handleCompare = () => {
    if (!beforeFiles || !afterFiles) return;
    setResult(computeArchitectureDiff(beforeFiles, afterFiles));
  };

  const handleClose = () => {
    setBeforeFiles(null);
    setAfterFiles(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={handleClose} />
      <div className="animate-fade-in-up relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-violet-600">
              <GitCompare size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Compare Architecture</h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Diff two codebases at the route/endpoint level — no data leaves your browser.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <FilePicker
              label="Before"
              accentClassName="text-red-500 dark:text-red-400"
              files={beforeFiles}
              isLoading={loadingSide === "before"}
              onPick={(fl) => void handlePick("before", fl)}
            />
            <FilePicker
              label="After"
              accentClassName="text-emerald-500 dark:text-emerald-400"
              files={afterFiles}
              isLoading={loadingSide === "after"}
              onPick={(fl) => void handlePick("after", fl)}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-3">
            {error ? (
              <span className="text-[11px] text-amber-600 dark:text-amber-400">{error}</span>
            ) : (
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Load a file or folder on each side, then compare.
              </span>
            )}
            <button
              onClick={handleCompare}
              disabled={!beforeFiles || !afterFiles || loadingSide !== null}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-600 dark:hover:bg-violet-500"
            >
              <GitCompare size={13} />
              Compare
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {result === null ? (
            <div className="flex h-full items-center justify-center text-[12px] text-slate-400 dark:text-slate-500">
              Load both sides and press Compare to see the diff graph.
            </div>
          ) : (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center gap-2">
                <SummaryChip icon={Plus} count={result.summary.added} label="Added" tone="emerald" />
                <SummaryChip icon={Minus} count={result.summary.removed} label="Removed" tone="red" />
                <SummaryChip icon={Pencil} count={result.summary.modified} label="Modified" tone="amber" />
              </div>
              {result.nodes.length === 0 ? (
                <div className="flex h-full items-center justify-center text-[12px] text-slate-400 dark:text-slate-500">
                  No routes, fetches, or endpoints detected on either side.
                </div>
              ) : (
                <ReactFlowProvider>
                  <ReactFlow
                    nodes={result.nodes}
                    edges={[]}
                    nodeTypes={nodeTypes}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    fitView
                    fitViewOptions={{ padding: 0.25 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                    className="bg-canvas dark:bg-slate-950"
                  >
                    <Background variant={BackgroundVariant.Dots} color="#CBD5E1" gap={20} size={1.4} />
                  </ReactFlow>
                </ReactFlowProvider>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryChip({
  icon: Icon,
  count,
  label,
  tone,
}: {
  icon: typeof Plus;
  count: number;
  label: string;
  tone: "emerald" | "red" | "amber";
}) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  }[tone];

  return (
    <div className={clsx("flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm", toneClass)}>
      <Icon size={11} />
      {count} {label}
    </div>
  );
}
