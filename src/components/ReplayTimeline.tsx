"use client";

import clsx from "clsx";
import { Pause, Play, Radio, SkipBack, SkipForward } from "lucide-react";
import type { ExecutionStep } from "@/lib/types";
import type { ReplaySpeed } from "@/hooks/useReplayTimeline";

interface ReplayTimelineProps {
  chronological: ExecutionStep[];
  effectiveIndex: number;
  isLive: boolean;
  playing: boolean;
  speed: ReplaySpeed;
  onSeek: (index: number) => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onTogglePlay: () => void;
  onGoLive: () => void;
  onSetSpeed: (speed: ReplaySpeed) => void;
}

const SPEEDS: ReplaySpeed[] = [0.5, 1, 2];

export default function ReplayTimeline({
  chronological,
  effectiveIndex,
  isLive,
  playing,
  speed,
  onSeek,
  onStepBack,
  onStepForward,
  onTogglePlay,
  onGoLive,
  onSetSpeed,
}: ReplayTimelineProps) {
  if (chronological.length === 0) return null;

  const current = chronological[effectiveIndex];
  const atStart = effectiveIndex <= 0;
  const atEnd = effectiveIndex >= chronological.length - 1;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-2">
      <div className="pointer-events-auto flex w-full max-w-xl flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <button
          onClick={onGoLive}
          disabled={isLive}
          title={isLive ? "Following live activity" : "Jump back to live activity"}
          className={clsx(
            "flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors disabled:cursor-default",
            isLive
              ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
              : "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900",
          )}
        >
          <Radio size={10} className={isLive ? "animate-pulse" : undefined} />
          {isLive ? "Live" : "Go Live"}
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onStepBack}
            disabled={atStart}
            title="Step back"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <SkipBack size={13} />
          </button>
          <button
            onClick={onTogglePlay}
            title={playing ? "Pause" : "Play"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-700 dark:bg-violet-600 dark:hover:bg-violet-500"
          >
            {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          </button>
          <button
            onClick={onStepForward}
            disabled={atEnd}
            title="Step forward"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <SkipForward size={13} />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(0, chronological.length - 1)}
          step={1}
          value={effectiveIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="h-1.5 min-w-[100px] flex-1 cursor-pointer accent-violet-600"
        />

        <span className="shrink-0 whitespace-nowrap text-[10.5px] tabular-nums text-slate-400 dark:text-slate-500">
          {effectiveIndex + 1} / {chronological.length}
        </span>

        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={clsx(
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                speed === s
                  ? "bg-slate-900 text-white dark:bg-violet-600"
                  : "text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800",
              )}
            >
              {s}x
            </button>
          ))}
        </div>

        {current && (
          <span className="w-full truncate text-center text-[10.5px] text-slate-400 dark:text-slate-500 sm:w-auto sm:flex-1 sm:text-left">
            {current.stepName} · {current.fromNode} → {current.toNode} · {current.latencyMs}ms
          </span>
        )}
      </div>
    </div>
  );
}
