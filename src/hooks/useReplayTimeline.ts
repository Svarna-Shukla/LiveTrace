"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExecutionStep } from "@/lib/types";

export type ReplaySpeed = 0.5 | 1 | 2;

const MIN_STEP_MS = 150;
const MAX_STEP_MS = 1800;

/**
 * Drives the bottom Replay Timeline bar. `log` is the same capped, newest-
 * first array `EventLog` already renders — reversed here into chronological
 * order and folded onto the base topology (via `computeReplayState`) to
 * reconstruct canvas state at any scrubbed point, so no separate history
 * buffer is kept.
 *
 * `index === null` means "live": the caller should render the true live
 * nodes/edges from `useTraceSocket` untouched. Any other index freezes the
 * canvas at that point in history until the user steps/plays to the end or
 * presses "Go Live".
 */
export function useReplayTimeline(log: ExecutionStep[]) {
  const chronological = useMemo(() => [...log].reverse(), [log]);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLive = index === null;
  const effectiveIndex = index === null ? chronological.length - 1 : index;

  const clampIndex = useCallback(
    (i: number) => Math.max(0, Math.min(chronological.length - 1, i)),
    [chronological.length],
  );

  const stopPlayback = useCallback(() => {
    setPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const seek = useCallback(
    (i: number) => {
      stopPlayback();
      setIndex(chronological.length === 0 ? null : clampIndex(i));
    },
    [chronological.length, clampIndex, stopPlayback],
  );

  const stepBack = useCallback(() => {
    stopPlayback();
    setIndex(clampIndex(effectiveIndex - 1));
  }, [effectiveIndex, clampIndex, stopPlayback]);

  const stepForward = useCallback(() => {
    stopPlayback();
    setIndex(clampIndex(effectiveIndex + 1));
  }, [effectiveIndex, clampIndex, stopPlayback]);

  const goLive = useCallback(() => {
    stopPlayback();
    setIndex(null);
  }, [stopPlayback]);

  const togglePlay = useCallback(() => {
    if (chronological.length === 0) return;
    if (playing) {
      stopPlayback();
      return;
    }
    setIndex(effectiveIndex >= chronological.length - 1 ? 0 : effectiveIndex);
    setPlaying(true);
  }, [playing, effectiveIndex, chronological.length, stopPlayback]);

  // A fresh topology (new upload, demo reload, file switch) clears the log —
  // snap back to live instead of pointing at a now-empty/unrelated history.
  useEffect(() => {
    if (chronological.length === 0 && (index !== null || playing)) {
      setIndex(null);
      setPlaying(false);
    }
  }, [chronological.length, index, playing]);

  useEffect(() => {
    if (!playing) return;
    if (effectiveIndex >= chronological.length - 1) {
      setPlaying(false);
      return;
    }
    const current = chronological[effectiveIndex];
    const next = chronological[effectiveIndex + 1];
    const rawGap = current && next ? next.timestamp - current.timestamp : MIN_STEP_MS;
    const stepMs = Math.min(MAX_STEP_MS, Math.max(MIN_STEP_MS, rawGap)) / speed;
    timerRef.current = setTimeout(() => setIndex(effectiveIndex + 1), stepMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, effectiveIndex, speed, chronological]);

  return {
    chronological,
    isLive,
    effectiveIndex,
    playing,
    speed,
    setSpeed,
    seek,
    stepBack,
    stepForward,
    togglePlay,
    goLive,
  };
}
