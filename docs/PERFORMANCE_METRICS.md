# Performance Metrics

## Overview

The PinePaper MCP Server includes a built-in performance tracking system that collects timing metrics for all tool operations. This system enables Claude to self-optimize workflows by identifying bottlenecks and choosing faster alternatives in real-time.

## Architecture

### In-Memory Storage

Metrics are stored **in-memory only** with the following characteristics:

- **Storage**: RAM-based, no persistence to disk
- **Retention**: Last 1000 operations (configurable)
- **Eviction**: LRU (Least Recently Used) when limit reached
- **Lifecycle**: Metrics reset when server restarts
- **Overhead**: Minimal (~1ms per operation)

### Design Philosophy

The metrics system is designed for **operational optimization**, not traditional infrastructure monitoring:

- ✅ Claude identifies slow operations during active sessions
- ✅ Real-time feedback for workflow decisions
- ✅ Zero infrastructure complexity
- ✅ No external dependencies
- ❌ Not for long-term trend analysis
- ❌ Not for production monitoring dashboards
- ❌ Not persisted across restarts

## Configuration

### Environment Variables

```bash
# Enable or disable metrics tracking (default: true)
PINEPAPER_METRICS_ENABLED=true

# Maximum number of operations to retain (default: 1000)
PINEPAPER_METRICS_RETENTION=1000
```

### Runtime Configuration

Metrics tracking is enabled by default. To disable:

```bash
export PINEPAPER_METRICS_ENABLED=false
```

To increase retention for longer sessions:

```bash
export PINEPAPER_METRICS_RETENTION=5000
```

## Metrics Tracked

### Execution Phases

Each tool execution is broken down into separate phases:

| Phase | Description | Typical Duration |
|-------|-------------|------------------|
| `validation` | Input parsing with Zod schemas | 1-5ms |
| `code_generation` | PinePaper.js code generation | 5-20ms |
| `browser_execution` | Code execution via Puppeteer | 30-100ms |
| `screenshot` | Screenshot capture (if enabled) | 50-150ms |
| `total` | End-to-end execution time | 40-250ms |

### Metric Fields

Each metric record contains:

```typescript
{
  toolName: string;        // e.g., 'pinepaper_create_item'
  phase: MetricPhase;      // execution phase
  duration: number;        // milliseconds
  timestamp: number;       // Unix timestamp
  success: boolean;        // whether operation succeeded
  error?: string;          // error message if failed
  metadata?: object;       // additional context
}
```

### Aggregate Statistics

When querying metrics, you get aggregate statistics:

- **count**: Total number of measurements
- **avgDuration**: Average duration in milliseconds
- **minDuration**: Fastest execution
- **maxDuration**: Slowest execution
- **p50**: Median (50th percentile)
- **p95**: 95th percentile
- **p99**: 99th percentile
- **successRate**: Percentage of successful operations (0-1)
- **totalDuration**: Sum of all durations

## Using Metrics

### MCP Tool: `pinepaper_get_performance_metrics`

Claude can query metrics using this tool:

```typescript
{
  name: 'pinepaper_get_performance_metrics',
  inputSchema: {
    toolName?: string,     // Filter by specific tool
    phase?: string,        // Filter by execution phase
    since?: number,        // Unix timestamp - metrics since this time
    limit?: number,        // Max results (default: 100)
    format?: string        // 'summary' | 'json' | 'csv'
  }
}
```

### Export Formats

#### 1. Summary Format (Human-Readable)

Best for quick analysis:

```
Performance Metrics Summary
==================================================

Tool: pinepaper_create_item | Phase: total
  Count: 23
  Avg: 142.50ms
  Min: 87.00ms
  Max: 312.00ms
  P50: 135.00ms
  P95: 245.00ms
  P99: 298.00ms
  Success Rate: 100.0%

Tool: pinepaper_batch_create | Phase: total
  Count: 5
  Avg: 298.20ms
  Min: 245.00ms
  Max: 389.00ms
  P50: 287.00ms
  P95: 378.00ms
  P99: 389.00ms
  Success Rate: 100.0%
```

#### 2. JSON Format (Structured Data)

Best for programmatic analysis:

```json
{
  "metrics": [
    {
      "toolName": "pinepaper_create_item",
      "phase": "total",
      "duration": 142,
      "timestamp": 1704067200000,
      "success": true
    },
    // ... more metrics
  ],
  "trackerInfo": {
    "totalMetrics": 245,
    "activeTimers": 0,
    "retention": 1000,
    "enabled": true
  }
}
```

#### 3. CSV Format (Spreadsheet Analysis)

Best for Excel/Google Sheets:

```csv
timestamp,toolName,phase,duration,success,error
1704067200000,"pinepaper_create_item","total",142,true,""
1704067201000,"pinepaper_create_item","total",135,true,""
1704067202000,"pinepaper_batch_create","total",298,true,""
```

## Use Cases

### 1. Identifying Slow Operations

**Scenario**: After creating many items, check which operations are slowest

```
Claude queries:
  pinepaper_get_performance_metrics(format: 'summary')

Result shows:
  - pinepaper_create_item: avg 145ms
  - pinepaper_batch_create: avg 298ms for 10 items (~30ms per item)

Claude decides: "I should use batch_create for the next 20 items"
```

### 2. Debugging Performance Regressions

**Scenario**: Animations seem slow

```
Claude queries:
  pinepaper_get_performance_metrics(
    toolName: 'pinepaper_animate',
    format: 'summary'
  )

Result shows:
  - P95: 450ms (expected ~150ms)
  - Phase breakdown shows browser_execution taking 400ms

Claude identifies: Browser connection may be slow, or canvas has too many items
```

### 3. Optimizing Screenshot Mode

**Scenario**: Operations are taking longer than expected

```
Claude queries:
  pinepaper_get_performance_metrics(phase: 'screenshot')

Result shows:
  - Screenshot phase taking 150ms per operation
  - 15 operations = 2.25 seconds wasted on screenshots

Claude suggests: "Let me disable automatic screenshots and only capture on request"
```

### 4. Comparing Batch vs Individual Operations

**Scenario**: Creating 10 items - which is faster?

```
Test 1: Individual creates
  pinepaper_create_item x 10
  Metrics show: 10 × 140ms = 1400ms total

Test 2: Batch create
  pinepaper_batch_create (10 items)
  Metrics show: 1 × 320ms = 320ms total

Result: Batch is 4.4x faster
```

## Performance Baselines

### Expected Durations (95th Percentile)

| Tool | Validation | Code Gen | Browser Exec | Screenshot | Total (no screenshot) | Total (with screenshot) |
|------|------------|----------|--------------|------------|-----------------------|-------------------------|
| create_item | <5ms | 10-15ms | 50-80ms | 100-150ms | 80-120ms | 180-270ms |
| batch_create (10x) | <5ms | 15-25ms | 100-200ms | 100-150ms | 150-250ms | 250-400ms |
| add_relation | <5ms | 8-12ms | 30-60ms | 100-150ms | 50-90ms | 150-240ms |
| animate | <5ms | 10-15ms | 40-70ms | 100-150ms | 60-100ms | 160-250ms |
| export_svg | <5ms | 5-10ms | 80-150ms | N/A | 100-180ms | 100-180ms |

### Optimization Thresholds

| Condition | Action |
|-----------|--------|
| Total > 500ms | Investigate bottleneck |
| Screenshot > 200ms | Check canvas complexity or network latency |
| Browser execution > 300ms | Too many items on canvas, or slow browser |
| Code generation > 50ms | Report as potential bug |
| Validation > 20ms | Report as potential bug |

## Troubleshooting

### High Latency

**Symptom**: All operations taking 2-3x longer than baseline

**Possible Causes**:
1. Browser connection slow (check network)
2. Too many items on canvas (>100 items)
3. Screenshot mode set to 'always' (disable if not needed)
4. Browser DevTools open (can slow Puppeteer)

**Solution**:
```typescript
// Check current metrics
pinepaper_get_performance_metrics(format: 'summary')

// Look for phase with highest duration
// If screenshot phase is slow: Change screenshot mode
// If browser_execution is slow: Clear canvas or close DevTools
```

### Metrics Not Collecting

**Symptom**: Metrics tool returns "No metrics available"

**Possible Causes**:
1. Metrics disabled via environment variable
2. No operations executed yet
3. Retention limit too low and metrics evicted

**Solution**:
```bash
# Check if enabled
echo $PINEPAPER_METRICS_ENABLED  # should be 'true' or unset

# Check retention
echo $PINEPAPER_METRICS_RETENTION  # should be >= 100

# Increase retention if needed
export PINEPAPER_METRICS_RETENTION=5000
```

### Memory Usage Concerns

**Symptom**: Concerned about memory usage

**Memory Calculation**:
- Each metric: ~200 bytes (estimate)
- Default retention: 1000 operations
- Total: ~200 KB

**For high-volume usage**:
```bash
# Reduce retention to limit memory
export PINEPAPER_METRICS_RETENTION=500  # ~100 KB

# Or disable entirely if not needed
export PINEPAPER_METRICS_ENABLED=false
```

## Implementation Details

### Code Structure

```
src/metrics/
├── types.ts                  # Type definitions
├── performance-tracker.ts    # Core PerformanceTracker class
└── index.ts                  # Exports

src/tools/
└── handlers.ts               # Integration with tool execution
```

### Key Functions

**PerformanceTracker API**:
```typescript
class PerformanceTracker {
  startTimer(id: string): void
  endTimer(id: string): number
  recordMetric(metric: TimingMetric): void
  getMetrics(filter?: MetricsFilter): TimingMetric[]
  getAggregateStats(metrics: TimingMetric[]): AggregateStats
  getSummary(filter?: MetricsFilter): MetricsSummary[]
  exportMetrics(format: MetricsExportFormat, filter?: MetricsFilter): string
  clear(): void
  enable(): void
  disable(): void
}
```

**Global Instance**:
```typescript
// Get or create singleton
const tracker = getPerformanceTracker(config?)

// Reset singleton (mainly for testing)
resetPerformanceTracker()
```

### Integration Pattern

Every tool execution automatically tracks timing:

```typescript
async function executeOrGenerate(
  code: string,
  description: string,
  options: HandlerOptions,
  toolName: string  // ← NEW: Tool name for metrics
): Promise<CallToolResult> {
  const tracker = getPerformanceTracker();
  const timerId = `${toolName}_${Date.now()}_${randomId}`;

  // Track total time
  tracker.startTimer(`${timerId}_total`);

  // Track browser execution
  tracker.startTimer(`${timerId}_browser_execution`);
  const result = await controller.executeCode(code, screenshot);
  const browserDuration = tracker.endTimer(`${timerId}_browser_execution`);

  tracker.recordMetric({
    toolName,
    phase: 'browser_execution',
    duration: browserDuration,
    timestamp: Date.now(),
    success: result.success,
  });

  // Track screenshot if taken
  if (screenshot) {
    tracker.startTimer(`${timerId}_screenshot`);
    // ... screenshot code ...
    const screenshotDuration = tracker.endTimer(`${timerId}_screenshot`);
    tracker.recordMetric({
      toolName,
      phase: 'screenshot',
      duration: screenshotDuration,
      timestamp: Date.now(),
      success: !!result.screenshot,
    });
  }

  // Record total
  const totalDuration = tracker.endTimer(`${timerId}_total`);
  tracker.recordMetric({
    toolName,
    phase: 'total',
    duration: totalDuration,
    timestamp: Date.now(),
    success: result.success,
  });

  return result;
}
```

## Future Enhancements

While the current in-memory approach is sufficient for Claude's self-optimization, these enhancements could be added later:

### Phase 1.3: External Monitoring (Optional)

**Prometheus Integration**:
- Add HTTP `/metrics` endpoint
- Export metrics in Prometheus format
- Scrape with Prometheus
- Visualize with Grafana

**Persistent Storage**:
- Option to write metrics to SQLite
- Option to export to JSON files periodically
- Rotate logs automatically

**Aggregation**:
- Pre-compute hourly/daily aggregates
- Track trends over time

### Other Potential Features

- **Alerts**: Trigger warnings when operations exceed thresholds
- **Comparison**: Compare metrics before/after code changes
- **Profiling**: Detailed breakdown of code generation time
- **Cost Tracking**: Estimate API costs based on operation counts

## Best Practices

### For Claude

1. **Query metrics after batch operations** to verify performance gains
2. **Check metrics when operations feel slow** to identify bottlenecks
3. **Use summary format first**, then drill down with filters if needed
4. **Compare batch vs individual** before processing large datasets
5. **Monitor screenshot phase** if total time seems high

### For Developers

1. **Keep retention at 1000** for most use cases (enough for typical sessions)
2. **Disable metrics in tests** if they interfere with test timing
3. **Don't rely on metrics across restarts** - they're session-only
4. **Add new phases** if you add new major operations
5. **Document expected baselines** when adding new tools

### For Users

1. **Leave metrics enabled** - overhead is negligible (~1ms)
2. **Increase retention for long sessions** if you want more history
3. **Export to CSV** if you want to analyze in Excel
4. **Use metrics to report performance issues** - include in bug reports

## Examples

### Example 1: Optimizing a Workflow

```typescript
// Before optimization - individual creates
for (let i = 0; i < 20; i++) {
  await pinepaper_create_item({ type: 'circle', position: {x: i*50, y: 100} })
}

// Check performance
await pinepaper_get_performance_metrics({
  toolName: 'pinepaper_create_item',
  format: 'summary'
})
// → Avg: 145ms × 20 = 2900ms total

// After optimization - batch create
await pinepaper_batch_create({
  items: [...20 circle definitions...]
})

// Check performance
await pinepaper_get_performance_metrics({
  toolName: 'pinepaper_batch_create',
  format: 'summary'
})
// → Avg: 350ms × 1 = 350ms total
// → 8.3x faster!
```

### Example 2: Debugging Slow Operations

```typescript
// Operation feels slow
await pinepaper_animate({ itemId: 'sun', animationType: 'pulse' })

// Check metrics
await pinepaper_get_performance_metrics({
  toolName: 'pinepaper_animate',
  format: 'summary',
  limit: 1
})
// → Shows: P95: 850ms (expected ~150ms)

// Drill down by phase
await pinepaper_get_performance_metrics({
  toolName: 'pinepaper_animate',
  phase: 'browser_execution',
  format: 'json'
})
// → Shows: browser_execution taking 800ms

// Diagnosis: Too many items on canvas causing slow rendering
// Solution: Clear unnecessary items first
await pinepaper_clear_canvas()
await pinepaper_animate({ itemId: 'sun', animationType: 'pulse' })
// → Now fast again (~150ms)
```

### Example 3: Export for Analysis

```typescript
// Export all metrics to CSV for spreadsheet analysis
const csv = await pinepaper_get_performance_metrics({
  format: 'csv'
})

// Save to file or copy to clipboard
// Then analyze in Excel/Google Sheets
// - Create pivot tables by tool/phase
// - Chart duration trends over time
// - Identify outliers
```

## Summary

The in-memory metrics system provides **real-time performance visibility** for Claude to self-optimize without any infrastructure complexity. It's designed for **operational optimization**, not long-term monitoring, and requires **zero configuration** to get started.

**Key Takeaways**:
- ✅ Automatic tracking for all operations
- ✅ Minimal overhead (~1ms)
- ✅ No persistence needed
- ✅ Query anytime via MCP tool
- ✅ Multiple export formats
- ✅ Perfect for Claude's self-optimization
