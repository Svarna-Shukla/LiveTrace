"use client";

import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, X } from "lucide-react";
import type { Edge, Node } from "@xyflow/react";
import { buildSharedFlow, encodeSharedFlow } from "@/lib/shareCodec";
import type { ServiceNodeData, TraceEdgeData } from "@/lib/topology";
import type { ExecutionStep } from "@/lib/types";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  nodes: Node<ServiceNodeData>[];
  edges: Edge<TraceEdgeData>[];
  log: ExecutionStep[];
}

export default function ShareModal({ open, onClose, nodes, edges, log }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = useMemo(() => {
    if (!open || typeof window === "undefined") return "";
    const flow = buildSharedFlow(nodes, edges, log);
    const encoded = encodeSharedFlow(flow);
    return `${window.location.origin}/canvas?flow=${encoded}`;
  }, [open, nodes, edges, log]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — the URL is still
      // visible and selectable in the input for a manual copy.
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = "livetrace-share-qr.png";
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="animate-fade-in-up relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Share Diagram</h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Read-only link — no source code or secrets included.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-5 py-5">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <QRCodeSVG value={shareUrl || " "} size={168} bgColor="#FFFFFF" fgColor="#0f172a" level="M" marginSize={2} />
          </div>
          <div className="hidden">
            <QRCodeCanvas
              ref={canvasRef}
              value={shareUrl || " "}
              size={512}
              bgColor="#FFFFFF"
              fgColor="#0f172a"
              level="M"
              marginSize={2}
            />
          </div>

          <div className="flex w-full items-center gap-1.5">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            />
            <button
              onClick={handleCopy}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {copied ? <Check size={13} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <button
            onClick={handleDownloadPng}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            <Download size={14} />
            Download QR Code (PNG)
          </button>
        </div>
      </div>
    </div>
  );
}
