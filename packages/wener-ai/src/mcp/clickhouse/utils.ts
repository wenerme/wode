export interface ClickHouseConnectionConfig {
	url: string;
	username?: string;
	password?: string;
	database?: string;
}

const TCP_PORT_MAP: Record<number, { httpPort: number; secure: boolean }> = {
	9000: { httpPort: 8123, secure: false },
	9440: { httpPort: 8443, secure: true },
};

/**
 * Parse a ClickHouse connection URL into config suitable for @clickhouse/client.
 *
 * Supported formats:
 * - http://user:pass@host:8123/db
 * - https://user:pass@host:8443/db
 * - tcp://user:pass@host:9000/db         → http://host:8123
 * - tcp://user:pass@host:9440/db?secure=true → https://host:8443
 * - clickhouse://user:pass@host:port/db  → http://host:port
 */
export function parseClickHouseUrl(raw: string): ClickHouseConnectionConfig {
	if (raw.startsWith('http://') || raw.startsWith('https://')) {
		return parseHttpUrl(raw);
	}

	if (raw.startsWith('tcp://') || raw.startsWith('clickhouse://')) {
		return parseTcpUrl(raw);
	}

	throw new Error(`Unsupported ClickHouse URL scheme: ${raw.split('://')[0] ?? raw}`);
}

function parseHttpUrl(raw: string): ClickHouseConnectionConfig {
	const parsed = new URL(raw);
	const database = parsed.pathname.slice(1) || undefined;
	const result: ClickHouseConnectionConfig = {
		url: `${parsed.protocol}//${parsed.hostname}:${parsed.port || (parsed.protocol === 'https:' ? 8443 : 8123)}`,
	};
	if (parsed.username) result.username = decodeURIComponent(parsed.username);
	if (parsed.password) result.password = decodeURIComponent(parsed.password);
	if (database) result.database = database;
	return result;
}

function parseTcpUrl(raw: string): ClickHouseConnectionConfig {
	const asHttp = raw.replace(/^(tcp|clickhouse):\/\//, 'http://');
	const parsed = new URL(asHttp);
	const port = parseInt(parsed.port, 10) || 9000;
	const secureParam = parsed.searchParams.get('secure')?.toLowerCase() === 'true';
	const mapping = TCP_PORT_MAP[port];

	let httpPort: number;
	let secure: boolean;

	if (mapping) {
		httpPort = mapping.httpPort;
		secure = mapping.secure;
	} else {
		httpPort = port;
		secure = secureParam;
	}

	if (secureParam) secure = true;

	const protocol = secure ? 'https' : 'http';
	const database = parsed.pathname.slice(1) || undefined;

	const result: ClickHouseConnectionConfig = {
		url: `${protocol}://${parsed.hostname}:${httpPort}`,
	};
	if (parsed.username) result.username = decodeURIComponent(parsed.username);
	if (parsed.password) result.password = decodeURIComponent(parsed.password);
	if (database) result.database = database;
	return result;
}

export function formatTable(rows: Record<string, unknown>[]): string {
	if (!rows.length) return '(no results)';
	const keys = Object.keys(rows[0]);
	const widths = keys.map((k) => Math.max(k.length, ...rows.map((r) => String(r[k] ?? '').length)));

	const header = keys.map((k, i) => k.padEnd(widths[i])).join(' | ');
	const separator = widths.map((w) => '-'.repeat(w)).join('-+-');
	const body = rows.map((row) => keys.map((k, i) => String(row[k] ?? '').padEnd(widths[i])).join(' | ')).join('\n');

	return `${header}\n${separator}\n${body}`;
}
