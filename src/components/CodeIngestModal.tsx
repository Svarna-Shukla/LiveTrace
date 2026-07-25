"use client";

import { useRef, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import { AlertTriangle, FileUp, PlayCircle, X } from "lucide-react";
import CodeEditor from "./CodeEditor";
import { buildDynamicTopology, CODE_PRESETS, parseCode } from "@/lib/codeParser";
import type { SimHop } from "@/lib/simulate";
import type { ServiceNodeData, TraceEdgeData } from "@/lib/topology";
import clsx from "clsx";

interface CodeIngestModalProps {
  open: boolean;
  onClose: () => void;
  onRun: (nodes: Node<ServiceNodeData>[], edges: Edge<TraceEdgeData>[], hops: SimHop[]) => void;
}

const ACCEPTED_EXTENSIONS = ".js,.jsx,.ts,.tsx,.json,.py,.zip";

export default function CodeIngestModal({ open, onClose, onRun }: CodeIngestModalProps) {
  const [code, setCode] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handlePreset = (id: string) => {
    const preset = CODE_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setCode(preset.code);
    setActivePreset(id);
    setNotice(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith(".zip")) {
      setNotice("ZIP archives aren't supported yet — please upload a single .js/.ts/.py/.json file, or paste code directly.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCode(String(reader.result ?? ""));
      setActivePreset(null);
      setNotice(null);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRun = () => {
    if (!code.trim()) {
      setNotice("Paste or upload some code first.");
      return;
    }
    const parsed = parseCode(code);
    const topology = buildDynamicTopology(parsed);
    if (!topology) {
      setNotice(
        "No API routes, env var access, or DB calls detected in this snippet. Try a preset, or paste code with a route handler.",
      );
      return;
    }
    onRun(topology.nodes, topology.edges, topology.hops);
    setNotice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
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

          <div className="mb-3 h-[280px]">
            <CodeEditor
              value={code}
              onChange={(v) => {
                setCode(v);
                setActivePreset(null);
              }}
              placeholder={"Paste a route handler, snippet, or file contents here…"}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <FileUp size={13} />
              Upload file
            </button>
            <span className="text-[10.5px] text-slate-400">.js · .ts · .py · .json · .zip</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {notice && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{notice}</span>
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
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <PlayCircle size={14} />
            Parse Code & Run Simulation
          </button>
        </div>
      </div>
    </div>
  );
}
