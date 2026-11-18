/**
 * Compare the parser with a real MySQL server on the MySQL fixtures (or on any block file).
 *
 * Every statement is compiled with `PREPARE` through `docker exec ... mysql`, so nothing runs and no
 * extra dependency is needed. Only syntax errors (1064) and parse-time rules (such as misplaced INTO)
 * count as rejections; errors that depend on schema or data mean the syntax is valid.
 *
 *   just mysql-oracle-up      # start mysql:8.4 and load tests/mysql-oracle.schema.sql
 *   just mysql-oracle         # check tests/test.mysql.sql and tests/error.test.mysql.sql
 *   just mysql-oracle FILE    # check statements in FILE, separated by lines containing only `----`
 *   just mysql-oracle-down
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { formatMysql, parseMysql, parseMysqlScript } from '../src/mysql';
import { readSqlCases } from './readSqlCases';

const container = process.env.MYSQL_ORACLE_CONTAINER || 'miniquery-mysql-oracle';
const password = process.env.MYSQL_ORACLE_PASSWORD || 'oracle';

// Errors raised after parsing; the statement's syntax was accepted.
const SEMANTIC = new Set([
	1046, 1049, 1052, 1054, 1055, 1056, 1060, 1066, 1093, 1096, 1111, 1146, 1172, 1176, 1191, 1193, 1210, 1222, 1235,
	1241, 1242, 1247, 1250, 1305, 1318, 1349, 1353, 1426, 1582, 1583, 1630, 1690, 1735, 3065, 3138, 3141, 3143, 3146,
	3567, 3568, 3569, 3577, 3579, 3581, 3582, 3583, 3584, 3585, 3587, 3588, 3589, 3590, 3591, 3593, 3594, 3596, 3636,
	3637, 3995, 3998,
]);
// Rejected while parsing, without a 1064: misplaced / duplicate INTO, derived table or table function without
// alias, USE with FORCE INDEX, undeclared variable (identifiers in LIMIT or window function constants), unknown
// EXPLAIN format.
const PARSE_RULES = new Set([1221, 1248, 1327, 1791, 3667, 3953, 3954]);
// Statements PREPARE does not support (LOCK, LOAD DATA, USE, ...): the oracle can not judge them.
const NOT_PREPARABLE = 1295;
// Cases where the parser deliberately differs from MySQL.
const DELIBERATE = new Set(['mysql-invalid-nested-executable-comment']);

type Block = { name: string; sql: string; expectError?: boolean };

function fixtureBlocks(): Block[] {
	const blocks: Block[] = [];
	for (const file of ['test.mysql.sql', 'error.test.mysql.sql']) {
		for (const fixture of readSqlCases<object, { mysqlVersion?: number; executableComments?: boolean }>(
			new URL(`./${file}`, import.meta.url),
		)) {
			// version-guarded executable comments depend on the server version, not only the syntax
			if (fixture.options.mysqlVersion !== undefined || fixture.options.executableComments === false) continue;
			if (fixture.error) {
				blocks.push({ name: fixture.name, sql: fixture.sql.trim().replace(/;\s*$/, ''), expectError: true });
				continue;
			}
			for (const statement of parseMysqlScript(fixture.sql, { locations: true }).statements) {
				blocks.push({ name: fixture.name, sql: fixture.sql.slice(statement.loc!.start, statement.loc!.end) });
			}
		}
	}
	return blocks;
}

function fileBlocks(file: string): Block[] {
	return readFileSync(file, 'utf8')
		.split(/^----\s*$/m)
		.map((sql) => sql.trim())
		.filter(Boolean)
		.map((sql, i) => ({ name: `#${i + 1}`, sql }));
}

function mysqlString(s: string) {
	return `'${s.replace(/[\\'\0\n\r\x1a]/g, (c) => ({ '\\': '\\\\', "'": "\\'", '\0': '\\0', '\n': '\\n', '\r': '\\r', '\x1a': '\\Z' })[c]!)}'`;
}

/** Server error number per block, `0` when PREPARE succeeded. One statement per line maps errors to blocks. */
function prepareAll(blocks: Block[]): number[] {
	const script = blocks.map((b) => `SET @q = ${mysqlString(b.sql)}; PREPARE oracle_stmt FROM @q;`).join('\n');
	// `--force` keeps going after errors and still exits 0, so always read stderr
	const result = spawnSync(
		'docker',
		[
			'exec',
			'-i',
			container,
			'mysql',
			'-uroot',
			`-p${password}`,
			'--default-character-set=utf8mb4',
			'shop',
			'--force',
			'-N',
		],
		{
			input: script,
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024,
		},
	);
	if (result.error) throw result.error;
	const stderr = result.stderr;
	// the client itself failed (no container, wrong password, ...), not individual statements
	if (result.status !== 0 && !/^ERROR \d+ \([^)]*\) at line/m.test(stderr))
		throw new Error(stderr || `mysql exited with ${result.status}`);
	const codes = blocks.map(() => 0);
	for (const m of stderr.matchAll(/^ERROR (\d+) \([^)]*\) at line (\d+)/gm)) codes[Number(m[2]) - 1] = Number(m[1]);
	return codes;
}

function parserResult(sql: string): { accepts: boolean; roundtrip: boolean } {
	try {
		const ast = parseMysql(sql);
		let roundtrip = false;
		try {
			roundtrip = isDeepStrictEqual(parseMysql(formatMysql(ast)), ast);
		} catch {}
		return { accepts: true, roundtrip };
	} catch (e) {
		if ((e as Error).name !== 'SyntaxError') throw e;
		return { accepts: false, roundtrip: true };
	}
}

const file = process.argv[2];
const blocks = file ? fileBlocks(file) : fixtureBlocks();
const codes = prepareAll(blocks);
const problems: string[] = [];
let skipped = 0;
blocks.forEach((block, i) => {
	const code = codes[i];
	if (code === NOT_PREPARABLE) {
		skipped++;
		return;
	}
	const known = code === 0 || SEMANTIC.has(code) || code === 1064 || PARSE_RULES.has(code);
	const serverAccepts = code === 0 || SEMANTIC.has(code);
	const parser = parserResult(block.sql);
	const sql = block.sql.replace(/\s+/g, ' ').slice(0, 140);
	if (!known) problems.push(`UNKNOWN-ERROR ${code} ${block.name}: ${sql}`);
	else if (DELIBERATE.has(block.name)) return;
	else if (serverAccepts !== parser.accepts) {
		problems.push(`${serverAccepts ? 'FALSE-REJECT' : 'FALSE-ACCEPT'} (server ${code || 'ok'}) ${block.name}: ${sql}`);
	} else if (block.expectError !== undefined && block.expectError === serverAccepts) {
		problems.push(`WRONG-FIXTURE (server ${code || 'ok'}) ${block.name}: ${sql}`);
	} else if (parser.accepts && !parser.roundtrip) problems.push(`ROUNDTRIP ${block.name}: ${sql}`);
});
console.log(`${blocks.length} statements, ${skipped} not preparable, ${problems.length} problems`);
for (const p of problems) console.log(p);
process.exitCode = problems.length ? 1 : 0;
