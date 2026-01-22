/**
 * PinePaper Agent Session Manager
 *
 * Manages job/session lifecycle for agent workflows.
 * Provides batch code execution, item tracking, and job state management.
 */

import type {
  JobContext,
  JobOptions,
  JobResult,
  ResetOptions,
  BatchExecuteResult,
  BatchOperation,
  ContentAnalysis,
  ExportRecommendation,
  ScreenshotPolicy,
  Platform,
  PLATFORM_PRESETS,
} from './types.js';

// Simple unique ID generator (avoids uuid dependency)
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// =============================================================================
// SESSION MANAGER CLASS
// =============================================================================

/**
 * Manages agent job/session lifecycle.
 *
 * Features:
 * - Job start/end with automatic tracking
 * - Code queuing for batch execution
 * - Item and relation tracking per job
 * - Screenshot policy management
 */
export class AgentSessionManager {
  private currentJob: JobContext | null = null;
  private jobHistory: JobResult[] = [];

  /**
   * Generate a unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${generateUniqueId()}`;
  }

  /**
   * Check if a job is currently active
   */
  hasActiveJob(): boolean {
    return this.currentJob !== null;
  }

  /**
   * Get the current job context
   */
  getCurrentJob(): JobContext | null {
    return this.currentJob;
  }

  /**
   * Start a new agent job
   */
  startJob(options: JobOptions = {}): JobContext {
    // End any existing job first
    if (this.currentJob) {
      console.warn('[AgentSession] Ending previous job before starting new one');
      // Don't await - just clean up state
      this.currentJob = null;
    }

    const jobId = this.generateJobId();
    const now = Date.now();

    this.currentJob = {
      jobId,
      name: options.name,
      startTime: now,
      itemsCreated: [],
      relationsCreated: [],
      codeQueue: [],
      screenshotPolicy: options.screenshotPolicy || 'on_complete',
      canvasPreset: options.canvasPreset,
      agentMode: true,
    };

    console.error(`[AgentSession] Started job: ${jobId}${options.name ? ` (${options.name})` : ''}`);

    return this.currentJob;
  }

  /**
   * End the current job and return results
   */
  endJob(): JobResult | null {
    if (!this.currentJob) {
      console.warn('[AgentSession] No active job to end');
      return null;
    }

    const job = this.currentJob;
    const duration = Date.now() - job.startTime;

    const result: JobResult = {
      jobId: job.jobId,
      name: job.name,
      duration,
      itemsCreated: [...job.itemsCreated],
      relationsCreated: [...job.relationsCreated],
    };

    // Store in history
    this.jobHistory.push(result);

    // Clear current job
    this.currentJob = null;

    console.error(`[AgentSession] Ended job: ${job.jobId} (${duration}ms, ${job.itemsCreated.length} items)`);

    return result;
  }

  /**
   * Queue code for batch execution
   */
  queueCode(code: string): void {
    if (!this.currentJob) {
      console.warn('[AgentSession] No active job - executing immediately');
      return;
    }

    this.currentJob.codeQueue.push(code);
  }

  /**
   * Get queued code and clear the queue
   */
  flushCodeQueue(): string[] {
    if (!this.currentJob) {
      return [];
    }

    const queue = [...this.currentJob.codeQueue];
    this.currentJob.codeQueue = [];
    return queue;
  }

  /**
   * Get combined code from queue as a single script
   */
  getCombinedCode(): string {
    if (!this.currentJob || this.currentJob.codeQueue.length === 0) {
      return '';
    }

    const queue = this.currentJob.codeQueue;

    // Wrap in IIFE with error handling and result collection
    const combinedCode = `
(async function() {
  const _results = [];
  const _itemIds = [];

  try {
${queue.map((code: string, i: number) => `
    // Operation ${i + 1}
    try {
      const _result${i} = await (async () => {
        ${code}
      })();
      _results.push({ index: ${i}, success: true, result: _result${i} });
      if (_result${i} && _result${i}.itemId) {
        _itemIds.push(_result${i}.itemId);
      }
    } catch (e) {
      _results.push({ index: ${i}, success: false, error: e.message });
      throw e; // Re-throw for atomic mode
    }
`).join('\n')}

    return { success: true, itemIds: _itemIds, results: _results };
  } catch (e) {
    return { success: false, error: e.message, itemIds: _itemIds, results: _results };
  }
})();
    `.trim();

    return combinedCode;
  }

  /**
   * Check if there's queued code
   */
  hasQueuedCode(): boolean {
    return this.currentJob !== null && this.currentJob.codeQueue.length > 0;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.currentJob?.codeQueue.length ?? 0;
  }

  /**
   * Register an item created during the job
   */
  registerItem(itemId: string): void {
    if (this.currentJob && itemId) {
      this.currentJob.itemsCreated.push(itemId);
    }
  }

  /**
   * Register a relation created during the job
   */
  registerRelation(relationId: string): void {
    if (this.currentJob && relationId) {
      this.currentJob.relationsCreated.push(relationId);
    }
  }

  /**
   * Get screenshot policy for current job
   */
  getScreenshotPolicy(): ScreenshotPolicy {
    return this.currentJob?.screenshotPolicy ?? 'on_request';
  }

  /**
   * Check if screenshot should be taken based on policy and event
   */
  shouldTakeScreenshot(event: 'operation' | 'error' | 'complete'): boolean {
    const policy = this.getScreenshotPolicy();

    switch (event) {
      case 'operation':
        return false; // Never screenshot per operation in agent mode
      case 'error':
        return policy === 'on_error' || policy === 'on_complete';
      case 'complete':
        return policy === 'on_complete';
      default:
        return false;
    }
  }

  /**
   * Generate code for canvas reset
   */
  generateResetCode(options: ResetOptions = {}): string {
    const parts: string[] = [];

    // Clear all items
    parts.push(`
// Clear canvas
if (app.clearCanvas) {
  app.clearCanvas();
} else {
  // Fallback: remove all items from text layer
  if (app.textItemGroup) {
    app.textItemGroup.removeChildren();
  }
  // Clear pattern group
  if (app.patternGroup) {
    app.patternGroup.removeChildren();
  }
  // Clear item registry
  if (app.itemRegistry) {
    app.itemRegistry.clear();
  }
  // Clear relation registry
  if (app.relationRegistry) {
    app.relationRegistry.clear();
  }
}
    `.trim());

    // Set canvas size if preset specified
    if (options.canvasPreset) {
      parts.push(`
// Set canvas size to preset
app.setCanvasSize('${options.canvasPreset}');
      `.trim());
    }

    // Set background color if specified
    if (options.backgroundColor && !options.preserveBackground) {
      parts.push(`
// Set background color
app.setBackgroundColor('${options.backgroundColor}');
      `.trim());
    }

    // Save history state
    parts.push(`
// Save state
if (app.historyManager) {
  app.historyManager.saveState();
}
({ success: true, reset: true });
    `.trim());

    return parts.join('\n\n');
  }

  /**
   * Get job history
   */
  getJobHistory(): JobResult[] {
    return [...this.jobHistory];
  }

  /**
   * Clear job history
   */
  clearHistory(): void {
    this.jobHistory = [];
  }

  /**
   * Get statistics about the current session
   */
  getStats(): {
    activeJob: boolean;
    currentJobId: string | null;
    currentJobDuration: number | null;
    itemsInCurrentJob: number;
    codeQueueSize: number;
    completedJobs: number;
    totalItemsCreated: number;
  } {
    const completedJobs = this.jobHistory.length;
    const totalItemsCreated = this.jobHistory.reduce((sum, job) => sum + job.itemsCreated.length, 0);

    return {
      activeJob: this.hasActiveJob(),
      currentJobId: this.currentJob?.jobId ?? null,
      currentJobDuration: this.currentJob ? Date.now() - this.currentJob.startTime : null,
      itemsInCurrentJob: this.currentJob?.itemsCreated.length ?? 0,
      codeQueueSize: this.getQueueSize(),
      completedJobs,
      totalItemsCreated: totalItemsCreated + (this.currentJob?.itemsCreated.length ?? 0),
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let sessionManagerInstance: AgentSessionManager | null = null;

/**
 * Get the singleton session manager instance
 */
export function getSessionManager(): AgentSessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new AgentSessionManager();
  }
  return sessionManagerInstance;
}

/**
 * Reset the session manager (useful for testing)
 */
export function resetSessionManager(): void {
  if (sessionManagerInstance) {
    if (sessionManagerInstance.hasActiveJob()) {
      sessionManagerInstance.endJob();
    }
    sessionManagerInstance.clearHistory();
  }
  sessionManagerInstance = null;
}
