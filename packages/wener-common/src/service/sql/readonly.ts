// This guard is deliberately conservative. The adapter must also enforce database-level read-only execution.
const writes = new Set(
	`insert update delete merge replace create alter drop truncate grant revoke vacuum analyze analyse copy load call execute do attach detach pragma set reset use lock unlock into outfile dumpfile returning`.split(
		' ',
	),
);
const safeFunctions = new Set(
	`count sum avg min max abs round ceil ceiling floor sqrt power mod coalesce nullif ifnull lower upper length char_length character_length trim ltrim rtrim substring substr replace concat concat_ws left right position extract date datetime time strftime julianday unixepoch date_trunc date_part to_char to_date to_timestamp cast convert json_extract json_type json_array_length json_valid json_object json_array json_build_object json_build_array jsonb_build_object jsonb_build_array array_agg string_agg group_concat row_number rank dense_rank lag lead first_value last_value nth_value ntile greatest least quote_literal quote_ident typeof format printf`.split(
		' ',
	),
);
const syntaxParens = new Set(
	`as in exists over partition filter select with recursive distinct all values case when not and or using on join from where having union intersect except`.split(
		' ',
	),
);
const typeNames = new Set(
	`bigint bigserial bit boolean bool bytea char character date decimal dec double float integer int interval json jsonb numeric real serial smallint text time timestamp timestamptz varchar varbit uuid blob clob`.split(
		' ',
	),
);
for (const name of [
	'version',
	'sqlite_version',
	'current_database',
	'current_schema',
	'current_schemas',
	'current_setting',
	'pg_typeof',
	'format_type',
	'hex',
	'unhex',
	'quote',
	'random',
])
	safeFunctions.add(name);
type Token = { value: string; kind: 'word' | 'identifier' | 'literal' | 'punct' };

function scan(statement: string, dialect?: string): Token[] | undefined {
	if (typeof statement !== 'string' || !statement.trim() || statement.includes('\0')) return;
	const pg = ['pg', 'postgres', 'postgresql'].includes(dialect ?? '');
	const mysql = ['mysql', 'mariadb'].includes(dialect ?? '');
	const tokens: Token[] = [];
	let ended = false;
	let depth = 0;
	for (let i = 0; i < statement.length; ) {
		const c = statement[i]!;
		if (/\s/u.test(c)) {
			i++;
			continue;
		}
		if (statement.startsWith('--', i)) {
			// MySQL requires whitespace after --; reject ambiguous forms in every dialect.
			if (!pg && !['sqlite', 'sqlite3'].includes(dialect ?? '') && statement[i + 2] && !/\s/u.test(statement[i + 2]!))
				return;
			i += 2;
			while (i < statement.length && !/[\r\n]/u.test(statement[i]!)) i++;
			continue;
		}
		if (c === '#') {
			if (!mysql) return;
			while (i < statement.length && !/[\r\n]/u.test(statement[i]!)) i++;
			continue;
		}
		if (statement.startsWith('/*', i)) {
			if (/^\/\*(?:!|M!)/iu.test(statement.slice(i))) return;
			i += 2;
			let nesting = 1;
			while (i < statement.length && nesting) {
				if (statement.startsWith('/*', i)) {
					if (!pg) return;
					nesting++;
					i += 2;
				} else if (statement.startsWith('*/', i)) {
					nesting--;
					i += 2;
				} else i++;
			}
			if (nesting) return;
			continue;
		}
		if (c === ';') {
			if (ended || !tokens.length || depth) return;
			ended = true;
			i++;
			continue;
		}
		if (ended) return;
		if (c === "'" || c === '"' || c === '`' || c === '[') {
			if (
				(c === '`' && !mysql && dialect !== 'sqlite') ||
				(c === '[' && !['sqlite', 'sqlite3', 'mssql', 'sqlserver'].includes(dialect ?? ''))
			)
				return;
			const end = c === '[' ? ']' : c;
			let value = '';
			let closed = false;
			i++;
			while (i < statement.length) {
				const next = statement[i++]!;
				// Backslash escaping depends on connection settings. Refuse ambiguity.
				if (next === '\\') return;
				if (next === end) {
					if (statement[i] === end) {
						value += end;
						i++;
					} else {
						closed = true;
						break;
					}
				} else value += next;
			}
			if (!closed) return;
			tokens.push({ kind: c === "'" ? 'literal' : 'identifier', value: c === "'" ? '' : value.toLowerCase() });
			continue;
		}
		if (c === '$') {
			const tag = statement.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/u)?.[0];
			if (tag) {
				if (!pg) return;
				const end = statement.indexOf(tag, i + tag.length);
				if (end < 0) return;
				i = end + tag.length;
				tokens.push({ kind: 'literal', value: '' });
				continue;
			}
			const parameter = statement.slice(i).match(/^\$[0-9]+/u)?.[0];
			if (!parameter) return;
			tokens.push({ kind: 'literal', value: '' });
			i += parameter.length;
			continue;
		}
		const word = statement.slice(i).match(/^[A-Za-z_][A-Za-z_0-9$]*/u)?.[0];
		if (word) {
			tokens.push({ kind: 'word', value: word.toLowerCase() });
			i += word.length;
			continue;
		}
		if (c === '(') depth++;
		if (c === ')' && --depth < 0) return;
		if (!/[0-9.,()+*/%<>=!|&~?:@\-]/u.test(c)) return;
		tokens.push({ kind: 'punct', value: c });
		i++;
	}
	return depth === 0 && tokens.length ? tokens : undefined;
}

export function hasMultipleSQLStatements(statement: string, dialect?: string): boolean {
	// Invalid or ambiguous input is unsafe for single-statement execution too.
	return !scan(statement, dialect);
}

export function isReadOnlySQL(statement: string, dialect?: string): boolean {
	const tokens = scan(statement, dialect);
	if (!tokens || tokens[0]?.kind !== 'word') return false;
	const first = tokens[0].value;
	if (!['select', 'with', 'explain', 'show'].includes(first)) return false;
	if ((first === 'with' || first === 'explain') && !tokens.some((t) => t.kind === 'word' && t.value === 'select'))
		return false;
	const cteColumns = new Set<number>();
	for (let start = 0; start < tokens.length; start++) {
		if (tokens[start]?.kind !== 'word' || tokens[start]?.value !== 'with') continue;
		let cursor = start + 1;
		if (tokens[cursor]?.value === 'recursive') cursor++;
		while (cursor < tokens.length) {
			const name = cursor++;
			if (!['word', 'identifier'].includes(tokens[name]?.kind ?? '')) break;
			if (tokens[cursor]?.value === '(') {
				let end = cursor + 1;
				while (
					end < tokens.length &&
					tokens[end]?.value !== ')' &&
					(['word', 'identifier'].includes(tokens[end]?.kind ?? '') || tokens[end]?.value === ',')
				)
					end++;
				if (tokens[end]?.value !== ')' || tokens[end + 1]?.value !== 'as') break;
				cteColumns.add(name);
				cursor = end + 1;
			}
			if (tokens[cursor++]?.value !== 'as') break;
			if (tokens[cursor]?.value === 'not') cursor++;
			if (tokens[cursor]?.value === 'materialized') cursor++;
			if (tokens[cursor]?.value !== '(') break;
			let depth = 0;
			do {
				const token = tokens[cursor++]?.value;
				if (token === '(') depth++;
				else if (token === ')') depth--;
			} while (cursor < tokens.length && depth > 0);
			if (tokens[cursor]?.value !== ',') break;
			cursor++;
		}
	}
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]!;
		if (
			token.kind === 'word' &&
			((writes.has(token.value) && !(token.value === 'replace' && tokens[i + 1]?.value === '(')) ||
				token.value === 'for')
		)
			return false;
		if ((token.kind === 'word' || token.kind === 'identifier') && tokens[i + 1]?.value === '(') {
			if (cteColumns.has(i)) continue;
			if (typeNames.has(token.value) && tokens[i - 1]?.value === 'as') continue;
			if (tokens[i - 1]?.value === '.' || token.kind === 'identifier') return false;
			if (!safeFunctions.has(token.value) && !syntaxParens.has(token.value)) return false;
		}
	}
	return true;
}

export function assertSQLAllowed(statement: string, readOnly: boolean, dialect?: string): void {
	if (hasMultipleSQLStatements(statement, dialect)) throw new Error('SQL requires one valid statement');
	if (readOnly && !isReadOnlySQL(statement, dialect)) throw new Error('SQL service is read-only');
}
