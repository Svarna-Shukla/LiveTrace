"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, FolderUp, Loader2, PlayCircle, X } from "lucide-react";
import CodeEditor from "./CodeEditor";
import { CODE_PRESETS } from "@/lib/codeParser";
import { extractZipSource, type IngestedFile } from "@/lib/zipIngest";
import { extractFolderSource } from "@/lib/folderIngest";
import { buildMultiFileGraphs, type MultiFileResult } from "@/lib/multiFile";
import clsx from "clsx";

interface CodeIngestModalProps {
  open: boolean;
  onClose: () => void;
  onRun: (multi: MultiFileResult, combinedSourceCode: string) => void;
}

const ACCEPTED_EXTENSIONS = ".js,.jsx,.ts,.tsx,.json,.py,.go,.zip,.env";

/** `webkitRelativePath` is only populated for folder selections/drops. */
const hasRelativePath = (file: File): boolean =>
  Boolean((file as File & { webkitRelativePath?: string }).webkitRelativePath);

type NoticeTone = "warning" | "success";

export default function CodeIngestModal({ open, onClose, onRun }: CodeIngestModalProps) {
  const [code, setCode] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<IngestedFile[] | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handlePreset = (id: string) => {
    const preset = CODE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setCode(preset.code);
    setActivePreset(id);
    setPendingFiles(null);
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
    const list = Array.from(files);
    if (list.length === 0) return;

    setActivePreset(null);
    setPendingFiles(null);
    setIsProcessing(true);
    setNotice(null);

    try {
      const isFolderSelection = list.length > 1 || hasRelativePath(list[0]);

      if (isFolderSelection) {
        const result = await extractFolderSource(list);
        if (result.fileCount === 0) {
          setNotice({
            tone: "warning",
            message:
              "No readable code files found in that folder (after skipping node_modules/.git/.next/dist/build and binaries).",
          });
          return;
        }
        setCode(result.combined);
        setPendingFiles(result.files);
        setNotice({
          tone: "success",
          message: `Loaded ${result.fileCount} file${result.fileCount === 1 ? "" : "s"} from the folder${
            result.skipped > 0 ? ` (${result.skipped} skipped)` : ""
          }${result.truncated ? " — folder was large, some files were truncated" : ""}. Each file will appear in the Explorer sidebar.`,
        });
        return;
      }

      const file = list[0];
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
        setPendingFiles(result.files);
        setNotice({
          tone: "success",
          message: `Extracted ${result.fileCount} file${result.fileCount === 1 ? "" : "s"} from ${file.name}${
            result.skipped > 0 ? ` (${result.skipped} skipped)` : ""
          }${result.truncated ? " — archive was large, some files were truncated" : ""}. Each file will appear in the Explorer sidebar.`,
        });
      } else {
        const text = await readTextFile(file);
        setCode(text);
        setPendingFiles([{ path: file.name, content: text }]);
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

    const preset = CODE_PRESETS.find((p) => p.id === activePreset);
    const files: IngestedFile[] = pendingFiles ?? [{ path: preset?.fileName ?? "snippet.js", content: code }];
    const multi = buildMultiFileGraphs(files);

    // A single pasted snippet with no detectable signature is a dead end —
    // warn instead of opening an empty canvas. A multi-file folder/zip is
    // still worth opening even if every file turns out to be code-only: the
    // Explorer + read-only code viewer remain useful.
    if (!multi.combined && files.length <= 1) {
      setNotice({
        tone: "warning",
        message:
          "No API routes, env var access, or DB calls detected in this snippet. Try a preset, or paste code with a route handler.",
      });
      return;
    }
    onRun(multi, code);
    setNotice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="animate-fade-in-up relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Upload / Paste Codebase</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Parse your own code into a live execution graph and run a trace through it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3">
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Presets
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CODE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePreset(preset.id)}
                  className={clsx(
                    "rounded-lg border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors",
                    activePreset === preset.id
                      ? "border-slate-800 bg-slate-800 text-white dark:border-violet-600 dark:bg-violet-600"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700",
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
                setPendingFiles(null);
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
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                <FileUp size={13} />
                Upload file
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700"
              >
                <FolderUp size={13} />
                Upload folder
              </button>
            </div>
            <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
              .js · .ts · .py · .go · .json · .env · .zip (drag &amp; drop supported)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {notice && (
            <div
              className={clsx(
                "mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11.5px]",
                notice.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
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

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
