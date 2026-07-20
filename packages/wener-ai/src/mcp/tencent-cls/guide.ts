// Search guide content for CQL syntax
export const SEARCH_GUIDE = `
# CLS Search Syntax Guide (CQL)

## Basic Syntax
| Syntax | Description |
|--------|-------------|
| key:value | Key-value search |
| value | Full-text search |
| AND | Logical AND (case-insensitive) |
| OR | Logical OR (case-insensitive) |
| NOT | Logical NOT (case-insensitive) |
| () | Grouping for precedence |
| " " | Phrase search (exact match with order) |
| ' ' | Phrase search (use when phrase contains ") |
| * | Wildcard (zero or more chars, not prefix) |
| > >= < <= = | Range operators for numeric fields |
| \\ | Escape special chars: space : ( ) > = < " ' * |
| key:* | Field exists (text: any value; numeric: has number) |
| key:"" | Field empty or not exists |

**Note:** AND has higher precedence than OR when no parentheses.

## Examples
\`\`\`
# Exact field match
trace_id:"49a5f9454b3fc0274d63b9eac304c96d"
user_id:"ABC"
level:ERROR

# Full-text search
ERROR
"connection timeout"

# Logical operators
level:ERROR AND pid:1234
level:ERROR OR level:WARNING
level:(ERROR OR WARNING)
level:ERROR AND NOT pid:1234

# Range queries
status>400
status:>=400
latency:>1.5

# Wildcard
host:www.test*.com
model:*flux*

# Field existence
url:*
response_time:*
\`\`\`

## Time Format
- Relative: \`now\`, \`now-1h\`, \`now-30m\`, \`now-7d\`, \`now/d\` (start of day)
- Simple: \`-1h\`, \`-30m\`, \`-1d\`, \`-7d\`
- ISO8601: \`2024-01-15T10:30:00Z\`
- Unix timestamp (seconds or milliseconds)

## Log Parse Failure
When a log fails to parse, it will only have a \`LogParseFailure\` field containing the raw log content.
Use \`LogParseFailure:*\` to find these logs. To understand them, you need to look at context logs.

Example patterns for finding parse failures:
\`\`\`
# Find logs that failed to parse
LogParseFailure:*

# Find parse failures containing specific text
LogParseFailure:"ALB adapter"
LogParseFailure:"apiStats"
\`\`\`

## Using cluster_logs Tool
The \`cluster_logs\` tool uses the Drain3 algorithm to automatically group similar log messages into patterns/templates.

Parameters:
- \`topic\`: Topic ID or name (required)
- \`query\`: CQL query to filter logs (default: *)
- \`field\`: Field to cluster, e.g., msg, error (default: msg)
- \`from\`/\`to\`: Time range (default: -1h to now)
- \`limit\`: Number of logs to sample, 10-1000 (default: 500)
- \`simTh\`: Similarity threshold 0.1-1.0 (default: 0.4, lower = more clusters)
- \`maxClusters\`: Maximum clusters to form (default: 100)

Example:
\`\`\`json
{
  "topic": "faas-llm-api-logs",
  "query": "user_id:\\"abc\\" AND level:ERROR",
  "field": "msg",
  "from": "-3d",
  "limit": 200
}
\`\`\`

Response:
\`\`\`json
{
  "totalLogs": 200,
  "clusterCount": 15,
  "clusters": [
    {
      "id": 1,
      "count": 50,
      "template": "request failed status code <*> message <*>",
      "sample": "request failed status code 400 message invalid request"
    }
  ]
}
\`\`\`

Use cases:
1. Discover common error patterns without knowing them beforehand
2. Group similar log messages to understand failure modes
3. Identify the most frequent error types by cluster count
4. Extract templates for creating more specific queries

## Using log_context Tool
The \`log_context\` tool retrieves surrounding logs for a specific log entry.
Use \`_pkgId\`, \`_pkgLogId\`, and \`_time\` from search results.

Parameters:
- \`topic\`: Topic ID or name (required)
- \`time\`: Log timestamp - accepts ISO8601, milliseconds, or \`_time\` from search (required)
- \`pkgId\`: Log package ID - use \`_pkgId\` from search results (required)
- \`pkgLogId\`: Log sequence number - use \`_pkgLogId\` from search results (required)
- \`prevLogs\`: Number of preceding logs (default: 10, max: 100)
- \`nextLogs\`: Number of following logs (default: 10, max: 100)
- \`query\`: Optional CQL filter for context logs

Example (using values from search results):
\`\`\`json
{
  "topic": "llm-usage",
  "time": "2026-01-14T15:30:45.000Z",
  "pkgId": "2D93CC4AFAEA550369670C25-0000000000004B94",
  "pkgLogId": "327684",
  "prevLogs": 10,
  "nextLogs": 10
}
\`\`\`

Use cases:
- Debug errors by viewing surrounding context
- Trace request flow across log entries
- Investigate issues with full context

## Using histogram Tool
The \`histogram\` tool returns log count distribution over time buckets.

Parameters:
- \`topic\`: Topic ID or name (required)
- \`query\`: CQL query to filter logs (default: *)
- \`from\`/\`to\`: Time range (default: -1h to now)
- \`buckets\`: Number of time buckets, 10-200 (default: 50)

Example:
\`\`\`json
{
  "topic": "llm-usage",
  "query": "user_id:\\"abc\\" AND model_name:\\"gpt-4\\"",
  "from": "-24h",
  "buckets": 24
}
\`\`\`

Response:
\`\`\`json
{
  "total": 158,
  "interval": 3600,
  "data": [
    { "t": "2026-01-14T00:00:00.000Z", "c": 4 },
    { "t": "2026-01-14T01:00:00.000Z", "c": 10 }
  ]
}
\`\`\`

Use cases:
- Visualize request volume over time
- Identify traffic spikes or anomalies
- Analyze usage patterns by hour/day

Source: https://cloud.tencent.com/document/product/614/47044
`.trim();
