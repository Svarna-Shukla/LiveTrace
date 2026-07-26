"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileCog,
  FileJson2,
  Folder,
  FolderOpen,
  LayoutDashboard,
} from "lucide-react";
import type { FileGraphEntry } from "@/lib/multiFile";

interface FileExplorerPanelProps {
  files: FileGraphEntry[];
  selectedFilePath: string | null;
  onSelectFile: (path: string | null) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: TreeNode[];
  entry?: FileGraphEntry;
}

function buildTree(files: FileGraphEntry[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const entry of files) {
    const parts = entry.file.path.split("/");
    let siblings = root;
    let accumulatedPath = "";
    parts.forEach((part, i) => {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
      const isFile = i === parts.length - 1;
      let node = siblings.find((n) => n.name === part && n.isFile === isFile);
      if (!node) {
        node = { name: part, path: accumulatedPath, isFile, children: [], entry: isFile ? entry : undefined };
        siblings.push(node);
      }
      siblings = node.children;
    });
  }
  return root;
}

function fileIcon(name: string) {
  if (name.startsWith(".env")) return { Icon: FileCog, className: "text-amber-500" };
  if (name.endsWith(".json")) return { Icon: FileJson2, className: "text-emerald-500" };
  return { Icon: FileCode2, className: "text-sky-500" };
}

function TreeItem({
  node,
  depth,
  selectedFilePath,
  onSelectFile,
}: {
  node: TreeNode;
  depth: number;
  selectedFilePath: string | null;
  onSelectFile: (path: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (node.isFile) {
    const isSelected = selectedFilePath === node.path;
    const isFlowchartReady = Boolean(node.entry?.isFlowchartReady);
    const { Icon, className } = fileIcon(node.name);
    return (
      <button
        onClick={() => onSelectFile(node.path)}
        title={
          isFlowchartReady
            ? node.path
            : `${node.path} (no active API, .env, or DB traces detected)`
        }
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={clsx(
          "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[12px] transition-colors",
          isSelected
            ? "bg-violet-50 font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
        )}
      >
        <Icon size={13} className={clsx("shrink-0", className, !isFlowchartReady && "opacity-40")} />
        <span className={clsx("min-w-0 flex-1 truncate", !isFlowchartReady && "opacity-50")}>{node.name}</span>
        {isFlowchartReady ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9.5px] font-semibold leading-none text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            ⚡ Diagram
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold leading-none text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            📄 Code
          </span>
        )}
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{ paddingLeft: `${depth * 14 + 2}px` }}
        className="flex w-full items-center gap-1 rounded-md py-1 pr-2 text-left text-[12px] font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {expanded ? (
          <FolderOpen size={13} className="text-slate-400 dark:text-slate-500" />
        ) : (
          <Folder size={13} className="text-slate-400 dark:text-slate-500" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {expanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={`${child.path}-${child.isFile}`}
              node={child}
              depth={depth + 1}
              selectedFilePath={selectedFilePath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorerPanel({ files, selectedFilePath, onSelectFile }: FileExplorerPanelProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  return (
    <div className="z-10 flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-border bg-white/95 p-3.5 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mb-2">
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-200">Explorer</h2>
        <p className="text-[10.5px] text-slate-400 dark:text-slate-500">
          {files.length} file{files.length === 1 ? "" : "s"} loaded
        </p>
      </div>

      <button
        onClick={() => onSelectFile(null)}
        className={clsx(
          "mb-1.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[12px] font-semibold transition-colors",
          selectedFilePath === null
            ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
        )}
      >
        <LayoutDashboard size={13} />
        Combined View
      </button>

      <div className="flex-1 space-y-0.5 overflow-y-auto border-t border-slate-100 pt-1.5 dark:border-slate-800">
        {tree.map((node) => (
          <TreeItem
            key={`${node.path}-${node.isFile}`}
            node={node}
            depth={0}
            selectedFilePath={selectedFilePath}
            onSelectFile={onSelectFile}
          />
        ))}
      </div>
    </div>
  );
}
