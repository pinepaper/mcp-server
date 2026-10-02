/**
 * MCP progress for a running tool call (notifications/progress).
 *
 * `progress` is elapsed seconds: it must increase with every notification,
 * and a time base is the one quantity that always does. What the work is
 * actually doing goes in `message`. For a video export that is the studio's
 * own percentage, read through `status`.
 */
export interface ProgressNotifier {
  progressToken: string | number;
  send: (n: { method: 'notifications/progress'; params: { progressToken: string | number; progress: number; message: string } }) => Promise<void>;
  intervalMs: number;
  label: string;
  status?: () => Promise<{ percent: number } | null>;
  now?: () => number;
}

/** Start reporting; returns stop(). */
export function startProgress(p: ProgressNotifier): () => void {
  const now = p.now ?? Date.now;
  const started = now();
  let last = 0;
  let stopped = false;
  const tick = async () => {
    const progress = Math.max(last + 1, Math.round((now() - started) / 1000));
    last = progress;
    let message = `${p.label}: working (${progress} s)`;
    try {
      const s = p.status ? await p.status() : null;
      if (s) message = `exporting: ${Math.round(s.percent)}%`;
    } catch { /* keep the elapsed message */ }
    if (stopped) return;
    await p.send({ method: 'notifications/progress', params: { progressToken: p.progressToken, progress, message } }).catch(() => {});
  };
  const timer = setInterval(() => { void tick(); }, p.intervalMs);
  return () => { stopped = true; clearInterval(timer); };
}
