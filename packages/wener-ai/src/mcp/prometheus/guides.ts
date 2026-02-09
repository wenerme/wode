export const PROMQL_GUIDE = `
# PromQL Quick Reference

## Basic Selectors
| Syntax | Description |
|--------|-------------|
| metric_name | Select all time series with metric name |
| metric_name{label="value"} | Label match (exact) |
| metric_name{label=~"regex"} | Label match (regex) |
| metric_name{label!="value"} | Negative match |
| metric_name{label!~"regex"} | Negative regex match |

## Common Functions
| Function | Description |
|----------|-------------|
| rate(v range-vector) | Per-second rate over range |
| irate(v range-vector) | Instant rate (last two points) |
| increase(v range-vector) | Total increase over range |
| sum(v) | Sum all values |
| avg(v) | Average of values |
| min(v), max(v) | Min/max values |
| count(v) | Count of elements |
| topk(k, v) | Top k elements |
| bottomk(k, v) | Bottom k elements |
| histogram_quantile(φ, v) | Calculate quantile from histogram |

## Aggregation Operators
| Operator | Description |
|----------|-------------|
| sum by (label) | Sum grouped by label |
| avg without (label) | Average excluding label |
| count by (label) | Count grouped by label |

## Range Vectors
| Duration | Meaning |
|----------|---------|
| [5m] | 5 minutes |
| [1h] | 1 hour |
| [1d] | 1 day |
| [1w] | 1 week |

## Examples
\`\`\`promql
# Request rate per second over 5 min
rate(http_requests_total[5m])

# 99th percentile latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Top 10 by CPU
topk(10, rate(container_cpu_usage_seconds_total[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# Memory usage by pod
sum by (pod) (container_memory_usage_bytes)

# Up status
up{job="my-service"}
\`\`\`

## Time Format
- RFC3339: 2024-01-15T10:30:00Z
- Unix timestamp: 1705316400
- Relative: now, now-1h, now-30m, now-1d

Source: https://prometheus.io/docs/prometheus/latest/querying/basics/
`.trim();
