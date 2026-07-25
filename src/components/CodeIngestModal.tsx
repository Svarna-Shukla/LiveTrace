"use client";

import { useRef, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, PlayCircle, X } from "lucide-react";
import CodeEditor from "./CodeEditor";
import { buildDynamicTopology, CODE_PRESETS, parseCode } from "@/lib/codeParser";
import { extractZipSource } from "@/lib/zipIngest";
import type { SimHop } from "@/lib/simulate";
import type { ServiceNodeData, TraceEdgeData } from "@/lib/topology";
import clsx from "clsx";

interface CodeIngestModalProps {
  open: boolean;
  onClose: () => void;
  onRun: (nodes: Node<ServiceNodeData>[], edges: Edge<TraceEdgeData>[], hops: SimHop[], sourceCode: string) => void;
}

const ACCEPTED_EXTENSIONS = ".js,.jsx,.ts,.tsx,.json,.py,.zip,.env";

type NoticeTone = "warning" | "success";

export default function CodeIngestModal({ open, onClose, onRun }: CodeIngestModalProps) {
  const [code, setCode] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handlePreset = (id: string) => {
    const preset = CODE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setCode(preset.code);
    setActivePreset(id);
    setNotice(null);
  };

  const readTextFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsText(file);
    });

  const handleFiles = async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;

    setActivePreset(null);
    setIsProcessing(true);
    setNotice(null);

    try {
      if (file.name.toLowerCase().endsWith(".zip")) {
        const result = await extractZipSource(file);
        if (result.fileCount === 0) {
          setNotice({
            tone: "warning",
            message: "No readable code files found in that archive (after skipping node_modules/.git/binaries).",
          });
          return;
        }
        setCode(result.combined);
        setNotice({
          tone: "success",
          message: `Extracted ${result.fileCount} file${result.fileCount === 1 ? "" : "s"} from ${file.name}${
            result.skipped > 0 ? ` (${result.skipped} skipped)` : ""
          }${result.truncated ? " — archive was large, some files were truncated" : ""}.`,
        });
      } else {
        const text = await readTextFile(file);
        setCode(text);
      }
    } catch (err) {
      setNotice({
        tone: "warning",
        message: err instanceof Error ? `Couldn't read that file: ${err.message}` : "Couldn't read that file.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void handleFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files);
  };

  const handleRun = () => {
    if (!code.trim()) {
      setNotice({ tone: "warning", message: "Paste or upload some code first." });
      return;
    }
    const parsed = parseCode(code);
    const topology = buildDynamicTopology(parsed);
    if (!topology) {
      setNotice({
        tone: "warning",
        message:
          "No API routes, env var access, or DB calls detected in this snippet. Try a preset, or paste code with a route handler.",
      });
      return;
    }
    onRun(topology.nodes, topology.edges, topology.hops, code);
    setNotice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="animate-fade-in-up relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Upload / Paste Codebase</h2>
            <p className="text-[11px] text-slate-400">
              Parse your own code into a live execution graph and run a trace through it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Presets</div>
            <div className="flex flex-wrap gap-1.5">
              {CODE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePreset(preset.id)}
                  className={clsx(
                    "rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors",
                    activePreset === preset.id
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={clsx(
              "relative mb-3 h-[280px] rounded-lg transition-all",
              isDragOver && "ring-2 ring-emerald-400 ring-offset-2",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <CodeEditor
              value={code}
              onChange={(v) => {
                setCode(v);
                setActivePreset(null);
              }}
              placeholder={"Paste a route handler, snippet, or file contents here… (or drag & drop a .zip / file)"}
            />
            {(isDragOver || isProcessing) && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-slate-900/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Extracting files…
                    </>
                  ) : (
                    <>
                      <FileUp size={16} />
                      Drop to upload
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileUp size={13} />
              Upload file
            </button>
            <span className="text-[10.5px] text-slate-400">
              .js · .ts · .py · .json · .env · .zip (drag &amp; drop supported)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {notice && (
            <div
              className={clsx(
                "mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11.5px]",
                notice.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700",
              )}
            >
              {notice.tone === "success" ? (
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleRun}
            disabled={isProcessing}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlayCircle size={14} />
            Parse Code & Run Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
