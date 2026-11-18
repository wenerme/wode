# DNS service capability

Portable zone and RRSet management (`DnsServiceCapability`, `woctl dns`). Providers live under
`service/provider/<name>` and must register `DnsOperations`; supplier-only features belong to a
separate capability with tool names that do not collide with DNS operations.

## Data model

- Names are canonical absolute names with a trailing dot; `.` is the root zone, `@` the apex.
- `RRSet.values` use RFC 1035 presentation (zone-file RDATA) format. Providers convert both ways:
  - TXT: quoted, multiple character-strings separated by spaces, `\"` escapes — `"v=spf1 -all"`, `"part 1" "part 2"`.
  - MX: `10 mx.example.com.`; SRV: `10 5 443 host.example.com.`.
  - CNAME/NS/PTR targets: absolute with a trailing dot.
- `values` contains only enabled records. Disabled records, comments and other supplier fields go in
  the open `metadata` (PowerDNS: `metadata.disabledValues`, `metadata.comments`).
- `setRecord` replaces the whole RRSet with the given values, all enabled. Records not listed —
  including previously disabled ones — are removed. Keeping disabled records requires a
  supplier-specific path (PowerDNS: `woctl powerdns api` with an RRSet PATCH).
- `listZone`/`listRecord` accept `limit`/`cursor` and return `nextCursor` while more items remain.
  Cursors are opaque and provider-specific.
- Writes are gated by service `readOnly` (default true) and `--yes`; `dryRun` previews without sending.

## Providers

- `powerdns` (`pdns`): RRSet-native; values pass through.
- `cloudflare` (`cf`): records grouped into RRSets; writes use one `dns_records/batch` transaction,
  refused when larger than `maxBatchChanges` (default 200). `ttl: 1` means automatic
  (`metadata.autoTtl`); proxied records ignore the TTL; `metadata.proxied` when uniform.
- `alidns` (`aliyun-dns`): records grouped into RRSets; writes are sequential and not atomic
  (`AlidnsPartialChangeError` reports applied / unknown / pending requests, also on timeout or close).
  Multi-string TXT is concatenated and read back split at 255 bytes. Writes only touch the default
  line; other lines are preserved and reported in `metadata.lineRecords`.
- Unparsable records keep their raw value and are flagged (`metadata.unparsedValues`).
- Server-side page cursors encode the page size (`p:<page>:<size>`); reuse with another `limit` is rejected.
- Shared helpers: `rdata.ts` (presentation-format conversion) and `rrset.ts` (diff plan, paging, deadline).
