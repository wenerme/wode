/** A lexical read-only guard for OpenObserve's DataFusion SQL, independent of CLI policy. */
const WRITES = new Set([
	'insert', 'update', 'delete', 'merge', 'replace', 'create', 'alter', 'drop', 'truncate',
	'grant', 'revoke', 'vacuum', 'analyze', 'analyse', 'copy', 'load', 'call', 'execute',
	'prepare', 'set', 'reset', 'attach', 'detach', 'install', 'export', 'import', 'into',
	'lock', 'unlock', 'commit', 'rollback',
]);
const SIDE_EFFECTS = new Set([
	'nextval', 'setval', 'dblink', 'dblink_exec', 'pg_write_file', 'pg_read_file',
	'pg_read_binary_file', 'lo_import', 'lo_export', 'set_config', 'pg_cancel_backend',
	'pg_terminate_backend', 'pg_reload_conf', 'pg_rotate_logfile', 'pg_logical_emit_message',
	'pg_sleep', 'pg_sleep_for', 'pg_sleep_until', 'load_extension', 'writefile', 'readfile',
	'sys_exec', 'sys_eval', 'sleep', 'get_lock', 'release_lock', 'http_get', 'http_post',
]);
interface Token { value: string; kind: 'word' | 'identifier' | 'literal' | 'symbol' }

/** Allows SELECT, query CTEs and EXPLAIN queries; it does not restrict DataFusion's pure functions. */
export function isReadOnlySQL(sql: string): boolean {
	if (typeof sql !== 'string') return false;
	const tokens: Token[] = [];
	let depth = 0;
	let ended = false;
	for (let i = 0; i < sql.length;) {
		const char = sql[i]!;
		if (/\s/u.test(char)) { i++; continue; }
		if (sql.startsWith('--', i)) {
			i += 2;
			while (i < sql.length && sql[i] !== '\n' && sql[i] !== '\r') i++;
			continue;
		}
		if (sql.startsWith('/*', i)) {
			// Executable comments and nested comments are deliberately rejected.
			const end = sql.indexOf('*/', i + 2);
			if (end < 0 || /^(?:!|M!)/iu.test(sql.slice(i + 2)) || sql.indexOf('/*', i + 2) < end && sql.indexOf('/*', i + 2) >= 0) return false;
			i = end + 2;
			continue;
		}
		if (ended) return false;
		if (char === ';') {
			if (depth || !tokens.length) return false;
			ended = true; i++; continue;
		}
		if (char === "'" || char === '"' || char === '`') {
			const quote = char;
			let value = '';
			let closed = false;
			for (i++; i < sql.length; i++) {
				if (sql[i] === '\\' && quote === "'") return false;
				if (sql[i] === quote) {
					if (sql[i + 1] === quote) { value += quote; i++; continue; }
					i++; closed = true; break;
				}
				value += sql[i];
			}
			if (!closed) return false;
			tokens.push({ value: value.toLowerCase(), kind: quote === "'" ? 'literal' : 'identifier' });
			continue;
		}
		if (/[a-z_]/iu.test(char)) {
			const start = i++;
			while (i < sql.length && /[a-z0-9_$]/iu.test(sql[i]!)) i++;
			tokens.push({ value: sql.slice(start, i).toLowerCase(), kind: 'word' });
			continue;
		}
		if (char === '$' || char === '\\' || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(char)) return false;
		if (char === '(') depth++;
		if (char === ')' && --depth < 0) return false;
		tokens.push({ value: char, kind: 'symbol' });
		i++;
	}
	if (depth || !tokens.length || tokens[0]?.kind !== 'word') return false;
	const first = tokens[0].value;
	if (!['select', 'with', 'explain'].includes(first)) return false;
	if (!tokens.some((token) => token.kind === 'word' && token.value === 'select')) return false;
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i]!;
		if (token.kind === 'word' && WRITES.has(token.value)) return false;
		if ((token.kind === 'word' || token.kind === 'identifier') && tokens[i + 1]?.value === '(' &&
			(SIDE_EFFECTS.has(token.value) || /^pg_(?:advisory|try_advisory)_/u.test(token.value))) return false;
	}
	// EXPLAIN's subject must itself be a query, rather than an arbitrary command containing SELECT.
	if (first === 'explain') {
		let i = 1;
		while (tokens[i]?.kind === 'word' && ['verbose', 'plan', 'for'].includes(tokens[i]!.value)) i++;
		if (tokens[i]?.kind !== 'word' || !['select', 'with'].includes(tokens[i]!.value)) return false;
	}
	return true;
}
