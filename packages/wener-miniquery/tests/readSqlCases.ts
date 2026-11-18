import { readFileSync } from 'node:fs';

export type SqlCase<E, O> = {
	name: string;
	line: number;
	sql: string;
	expect?: E;
	error: boolean;
	mysqlReject: boolean;
	options: O;
};

/** Fixtures split at explicit case headers, never at SQL semicolons. */
export function readSqlCases<E extends object, O extends object = Record<string, never>>(
	url: URL,
): Array<SqlCase<E, O>> {
	return parseSqlCases<E, O>(readFileSync(url, 'utf8'), url.pathname);
}

export function parseSqlCases<E extends object, O extends object = Record<string, never>>(
	text: string,
	source: string,
): Array<SqlCase<E, O>> {
	const headers = [...text.matchAll(/^-- @case ([^\r\n]+)\r?$/gm)];
	const names = new Set<string>();
	if (!headers.length) throw new Error(`No SQL cases in ${source}`);
	const preamble = text.slice(0, headers[0].index);
	if (/^[\t ]*--[\t ]*@/m.test(preamble)) {
		throw new Error(`Malformed fixture directive before the first case in ${source}`);
	}
	if (preamble.split(/\r?\n/).some((line) => line.trim() && !line.startsWith('--'))) {
		throw new Error(`Unscoped SQL before the first case in ${source}`);
	}
	return headers.map((header, index) => {
		const name = header[1].trim();
		const line = text.slice(0, header.index).split('\n').length;
		const fail = (message: string): never => {
			throw new Error(`${source}:${line} (${name}): ${message}`);
		};
		if (!name || names.has(name)) fail('missing or duplicate case name');
		names.add(name);
		const lines = text.slice(header.index + header[0].length, headers[index + 1]?.index).split('\n');
		const metadata = new Map<string, unknown>();
		let bodyStart = 0;
		while (bodyStart < lines.length) {
			const current = lines[bodyStart].trim();
			if (!current) {
				bodyStart++;
				continue;
			}
			if (!current.startsWith('-- @')) break;
			const match = /^-- @(expect|error|options|mysql-reject)(?:\s+(.*))?$/.exec(current);
			if (!match) fail(`unknown directive ${current}`);
			const [, key, value] = match!;
			if (metadata.has(key)) fail(`duplicate @${key}`);
			if (key === 'error' || key === 'mysql-reject') {
				if (value) fail(`@${key} takes no value`);
				metadata.set(key, true);
			} else {
				let parsed: unknown;
				try {
					parsed = JSON.parse(value || '');
				} catch {
					fail(`@${key} requires a JSON object`);
				}
				if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(`@${key} requires a JSON object`);
				metadata.set(key, parsed);
			}
			bodyStart++;
		}
		if (metadata.has('expect') === metadata.has('error')) fail('require exactly one @expect or @error');
		if (metadata.has('mysql-reject') && metadata.has('error')) fail('@mysql-reject requires a successful Doris case');
		const sql = lines.slice(bodyStart).join('\n').trim();
		if (!sql) fail('empty SQL body');
		if (/^[\t ]*--[\t ]*@/m.test(sql)) fail('misplaced or malformed fixture directive in SQL body');
		return {
			name,
			line,
			sql,
			expect: metadata.get('expect') as E | undefined,
			error: metadata.has('error'),
			mysqlReject: metadata.has('mysql-reject'),
			options: (metadata.get('options') ?? {}) as O,
		};
	});
}
