"use client";

import { useEffect, useRef } from "react";

type Props = {
  enrollmentId: string;
  lessonId: string;
  durationSeconds: number | null;
  initialProgressPct: number;
  onProgressUpdate?: (data: { progressPct: number; completed: boolean }) => void;
};

const TICK_MS = 1_000;
const FLUSH_INTERVAL_MS = 10_000;
const MIN_TARGET_SECONDS = 60;

/**
 * Fallback-based progress tracker. Counts seconds of focused page time
 * and flushes the derived progress percentage to /api/progress every 10s.
 * The Bunny iframe does not expose stable postMessage events without
 * library-specific config, so we approximate completion via active dwell
 * (≥ max(60s, durationSeconds * 0.9)). Documented in task.md.
 */
export function ProgressTracker({
  enrollmentId,
  lessonId,
  durationSeconds,
  initialProgressPct,
  onProgressUpdate,
}: Props) {
  const focusedRef = useRef<boolean>(true);
  const elapsedRef = useRef<number>(0);
  const lastSentPctRef = useRef<number>(initialProgressPct);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const targetSeconds = Math.max(
      MIN_TARGET_SECONDS,
      Math.round((durationSeconds ?? 0) * 0.9) || MIN_TARGET_SECONDS,
    );

    const computePct = (): number => {
      const pct = Math.min(100, Math.round((elapsedRef.current / targetSeconds) * 100));
      return Math.max(pct, lastSentPctRef.current);
    };

    const onVisibility = () => {
      focusedRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    focusedRef.current = !document.hidden;

    const tick = window.setInterval(() => {
      if (focusedRef.current) elapsedRef.current += TICK_MS / 1000;
    }, TICK_MS);

    const flush = window.setInterval(async () => {
      const nextPct = computePct();
      if (nextPct <= lastSentPctRef.current) return;
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ enrollmentId, lessonId, progressPct: nextPct }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { progressPct: number; completed: boolean };
        lastSentPctRef.current = Math.max(lastSentPctRef.current, data.progressPct);
        onProgressUpdate?.(data);
      } catch {
        /* swallow network errors; will retry on next tick */
      }
    }, FLUSH_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(tick);
      window.clearInterval(flush);
    };
  }, [enrollmentId, lessonId, durationSeconds, onProgressUpdate]);

  return null;
}
