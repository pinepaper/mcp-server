/**
 * Performance Tracker
 *
 * Tracks execution timing metrics for MCP tool operations.
 * Provides aggregate statistics and export functionality.
 */

import {
  TimingMetric,
  MetricPhase,
  AggregateStats,
  MetricsFilter,
  MetricsExportFormat,
  MetricsSummary,
} from './types.js';

/**
 * Configuration options for PerformanceTracker
 */
export interface PerformanceTrackerConfig {
  /** Maximum number of metrics to retain in memory (default: 1000) */
  maxRetention?: number;

  /** Whether tracking is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Performance tracking and metrics collection
 */
export class PerformanceTracker {
  private metrics: TimingMetric[] = [];
  private activeTimers: Map<string, number> = new Map();
  private maxRetention: number;
  private enabled: boolean;

  constructor(config: PerformanceTrackerConfig = {}) {
    this.maxRetention = config.maxRetention ?? 1000;
    this.enabled = config.enabled ?? true;
  }

  /**
   * Start a timer with a unique ID
   */
  startTimer(id: string): void {
    if (!this.enabled) return;
    this.activeTimers.set(id, Date.now());
  }

  /**
   * End a timer and return elapsed time in milliseconds
   */
  endTimer(id: string): number {
    if (!this.enabled) return 0;

    const startTime = this.activeTimers.get(id);
    if (!startTime) {
      console.error(`[PerformanceTracker] Timer '${id}' not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.activeTimers.delete(id);
    return duration;
  }

  /**
   * Record a timing metric
   */
  recordMetric(metric: TimingMetric): void {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Enforce retention limit (LRU eviction)
    if (this.metrics.length > this.maxRetention) {
      this.metrics.shift(); // Remove oldest
    }
  }

  /**
   * Get metrics matching filter criteria
   */
  getMetrics(filter?: MetricsFilter): TimingMetric[] {
    let results = [...this.metrics];

    if (!filter) return results;

    // Apply filters
    if (filter.toolName) {
      results = results.filter((m) => m.toolName === filter.toolName);
    }

    if (filter.phase) {
      results = results.filter((m) => m.phase === filter.phase);
    }

    if (filter.success !== undefined) {
      results = results.filter((m) => m.success === filter.success);
    }

    if (filter.since) {
      results = results.filter((m) => m.timestamp >= filter.since!);
    }

    if (filter.until) {
      results = results.filter((m) => m.timestamp <= filter.until!);
    }

    // Apply limit
    if (filter.limit && filter.limit > 0) {
      results = results.slice(-filter.limit); // Most recent N
    }

    return results;
  }

  /**
   * Calculate aggregate statistics for metrics
   */
  getAggregateStats(metrics: TimingMetric[]): AggregateStats {
    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        successRate: 0,
        totalDuration: 0,
      };
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const successCount = metrics.filter((m) => m.success).length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      count: metrics.length,
      avgDuration: totalDuration / metrics.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
      successRate: successCount / metrics.length,
      totalDuration,
    };
  }

  /**
   * Calculate percentile value
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Get summary metrics for a tool or phase
   */
  getSummary(filter?: MetricsFilter): MetricsSummary[] {
    const metrics = this.getMetrics(filter);

    if (metrics.length === 0) {
      return [];
    }

    // Group by tool name and phase
    const grouped = new Map<string, TimingMetric[]>();

    for (const metric of metrics) {
      const key = `${metric.toolName}:${metric.phase}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    // Generate summaries
    const summaries: MetricsSummary[] = [];

    for (const [key, metricGroup] of grouped.entries()) {
      const [toolName, phase] = key.split(':');
      summaries.push({
        toolName,
        phase: phase as MetricPhase,
        stats: this.getAggregateStats(metricGroup),
        recentMetrics: metricGroup.slice(-5), // Last 5 measurements
      });
    }

    // Sort by average duration (slowest first)
    summaries.sort((a, b) => b.stats.avgDuration - a.stats.avgDuration);

    return summaries;
  }

  /**
   * Export metrics in specified format
   */
  exportMetrics(format: MetricsExportFormat, filter?: MetricsFilter): string {
    const metrics = this.getMetrics(filter);

    switch (format) {
      case 'json':
        return JSON.stringify(metrics, null, 2);

      case 'csv':
        return this.exportCSV(metrics);

      case 'summary':
        return this.exportSummary(filter);

      default:
        throw new Error(`Unknown export format: ${format}`);
    }
  }

  /**
   * Export metrics as CSV
   */
  private exportCSV(metrics: TimingMetric[]): string {
    const headers = ['timestamp', 'toolName', 'phase', 'duration', 'success', 'error'];
    const rows = metrics.map((m) => [
      m.timestamp,
      m.toolName,
      m.phase,
      m.duration,
      m.success,
      m.error || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Export summary statistics
   */
  private exportSummary(filter?: MetricsFilter): string {
    const summaries = this.getSummary(filter);

    if (summaries.length === 0) {
      return 'No metrics available';
    }

    const lines: string[] = ['Performance Metrics Summary', '=' .repeat(50), ''];

    for (const summary of summaries) {
      const stats = summary.stats;
      lines.push(`Tool: ${summary.toolName} | Phase: ${summary.phase}`);
      lines.push(`  Count: ${stats.count}`);
      lines.push(`  Avg: ${stats.avgDuration.toFixed(2)}ms`);
      lines.push(`  Min: ${stats.minDuration.toFixed(2)}ms`);
      lines.push(`  Max: ${stats.maxDuration.toFixed(2)}ms`);
      lines.push(`  P50: ${stats.p50.toFixed(2)}ms`);
      lines.push(`  P95: ${stats.p95.toFixed(2)}ms`);
      lines.push(`  P99: ${stats.p99.toFixed(2)}ms`);
      lines.push(`  Success Rate: ${(stats.successRate * 100).toFixed(1)}%`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeTimers.clear();
  }

  /**
   * Get tracker statistics
   */
  getStats(): {
    totalMetrics: number;
    activeTimers: number;
    retention: number;
    enabled: boolean;
  } {
    return {
      totalMetrics: this.metrics.length,
      activeTimers: this.activeTimers.size,
      retention: this.maxRetention,
      enabled: this.enabled,
    };
  }

  /**
   * Enable tracking
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable tracking
   */
  disable(): void {
    this.enabled = false;
  }
}

// Global singleton instance
let globalTracker: PerformanceTracker | null = null;

/**
 * Get or create the global performance tracker instance
 */
export function getPerformanceTracker(config?: PerformanceTrackerConfig): PerformanceTracker {
  if (!globalTracker) {
    // Check environment variables for configuration
    const envConfig: PerformanceTrackerConfig = {
      enabled: process.env.PINEPAPER_METRICS_ENABLED !== 'false',
      maxRetention: process.env.PINEPAPER_METRICS_RETENTION
        ? parseInt(process.env.PINEPAPER_METRICS_RETENTION, 10)
        : 1000,
    };

    globalTracker = new PerformanceTracker({ ...envConfig, ...config });
  }

  return globalTracker;
}

/**
 * Reset the global performance tracker (mainly for testing)
 */
export function resetPerformanceTracker(): void {
  globalTracker = null;
}
