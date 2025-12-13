/**
 * Performance Metrics Types
 *
 * Type definitions for performance tracking and metrics collection.
 */

/**
 * Phase of tool execution being measured
 */
export type MetricPhase =
  | 'validation'        // Input validation with Zod
  | 'code_generation'   // Code generation from inputs
  | 'browser_execution' // Browser code execution via Puppeteer
  | 'screenshot'        // Screenshot capture
  | 'total';            // Total execution time

/**
 * A single timing metric for a tool execution phase
 */
export interface TimingMetric {
  /** Tool name (e.g., 'pinepaper_create_item') */
  toolName: string;

  /** Execution phase being measured */
  phase: MetricPhase;

  /** Duration in milliseconds */
  duration: number;

  /** Unix timestamp when metric was recorded */
  timestamp: number;

  /** Whether the operation succeeded */
  success: boolean;

  /** Error message if operation failed */
  error?: string;

  /** Additional metadata about the operation */
  metadata?: Record<string, unknown>;
}

/**
 * Aggregate statistics for a set of metrics
 */
export interface AggregateStats {
  /** Total number of measurements */
  count: number;

  /** Average duration in milliseconds */
  avgDuration: number;

  /** Minimum duration in milliseconds */
  minDuration: number;

  /** Maximum duration in milliseconds */
  maxDuration: number;

  /** Median duration (50th percentile) in milliseconds */
  p50: number;

  /** 95th percentile duration in milliseconds */
  p95: number;

  /** 99th percentile duration in milliseconds */
  p99: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Total duration of all operations in milliseconds */
  totalDuration: number;
}

/**
 * Filter options for querying metrics
 */
export interface MetricsFilter {
  /** Filter by tool name */
  toolName?: string;

  /** Filter by execution phase */
  phase?: MetricPhase;

  /** Filter by success status */
  success?: boolean;

  /** Filter metrics since this timestamp (Unix timestamp) */
  since?: number;

  /** Filter metrics until this timestamp (Unix timestamp) */
  until?: number;

  /** Maximum number of results to return */
  limit?: number;
}

/**
 * Export format for metrics
 */
export type MetricsExportFormat = 'json' | 'csv' | 'summary';

/**
 * Metrics summary for tool or phase
 */
export interface MetricsSummary {
  /** Tool name or 'all' for aggregate */
  toolName: string;

  /** Phase or 'all' for aggregate */
  phase: MetricPhase | 'all';

  /** Aggregate statistics */
  stats: AggregateStats;

  /** Recent measurements (last N) */
  recentMetrics?: TimingMetric[];
}
