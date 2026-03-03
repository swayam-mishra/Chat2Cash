import { useState, useEffect } from "react";
import type { JobStatus } from "@/lib/types";

const TERMINAL_STATES = new Set(["completed", "failed"]);

/**
 * Real-time job status tracking with SSE + exponential backoff polling fallback.
 *
 * Strategy
 * ────────
 * 1. Opens an EventSource to GET /api/jobs/:id/stream (SSE).
 *    The server pushes `status` events until the job reaches a terminal state,
 *    then closes the connection — zero polling overhead on the client.
 *
 * 2. If the EventSource emits an error (browser doesn't support SSE, network
 *    hiccup, server returned non-200), it falls back to fetch-based polling
 *    with exponential backoff: 1s → 2s → 4s → … capped at 30s.
 *    This is far cheaper than fixed-interval polling under load.
 *
 * Usage
 * ─────
 *   const { status, done, error } = useJobStatus(jobId);
 *   // status?.state === "completed" when the order is ready
 *   // status?.result holds the ExtractedOrder
 */
export function useJobStatus(jobId: string | null) {
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let active = true;
    let es: EventSource | null = null;
    let backoffTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    // ── Exponential backoff polling (fallback) ──────────────────────────
    const poll = () => {
      if (!active) return;

      const delay = Math.min(30_000, 1_000 * Math.pow(2, attempt));
      attempt++;

      backoffTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data: JobStatus = await res.json();
          if (!active) return;

          setStatus(data);

          if (TERMINAL_STATES.has(data.state)) {
            setDone(true);
          } else {
            poll(); // schedule next poll
          }
        } catch (err) {
          if (!active) return;
          setError(err instanceof Error ? err : new Error(String(err)));
          poll(); // retry even on network errors
        }
      }, delay);
    };

    // ── SSE (primary) ───────────────────────────────────────────────────
    const startSSE = () => {
      if (!("EventSource" in window)) {
        // Browser doesn't support SSE — go straight to polling
        poll();
        return;
      }

      es = new EventSource(`/api/jobs/${jobId}/stream`);

      es.addEventListener("status", (e: MessageEvent) => {
        try {
          const data: JobStatus = JSON.parse(e.data);
          if (!active) return;
          setStatus(data);
          if (TERMINAL_STATES.has(data.state)) {
            setDone(true);
            es?.close();
          }
        } catch {
          // Ignore malformed frames
        }
      });

      es.addEventListener("error_event", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (!active) return;
          setError(new Error(data.message ?? "Job stream error"));
          setDone(true);
          es?.close();
        } catch {
          // Ignore malformed frames
        }
      });

      es.onerror = () => {
        // EventSource auto-reconnects on transient errors. Only switch to
        // polling if the connection is definitively closed (readyState 2).
        if (es?.readyState === EventSource.CLOSED) {
          es = null;
          if (active) poll();
        }
      };
    };

    startSSE();

    return () => {
      active = false;
      es?.close();
      if (backoffTimer) clearTimeout(backoffTimer);
    };
  }, [jobId]);

  return { status, done, error };
}
