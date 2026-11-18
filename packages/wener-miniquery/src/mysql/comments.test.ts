import { describe, expect, test } from 'vitest';
import {
	analyzeMysql,
	expandExecutableComments,
	formatMysql,
	parseMysql,
	parseMysqlExpr,
	parseMysqlScript,
	scanMysqlComments,
	visitMysql,
} from './index';

describe('native MySQL comments', () => {
	test('captures ordinary comments, hints and version guards as separate AST nodes', () => {
		const sql = '/* before */ SELECT /*+ MAX_EXECUTION_TIME(1000) */ id FROM t /*!80000 WHERE id > 0 */; # after';
		const script = parseMysqlScript(sql);
		expect(script.comments.map(({ kind, value, version }) => ({ kind, value, version }))).toEqual([
			{ kind: 'block', value: ' before ' },
			{ kind: 'hint', value: ' MAX_EXECUTION_TIME(1000) ' },
			{ kind: 'executable', value: ' WHERE id > 0 ', version: 80000 },
			{ kind: 'line', value: ' after' },
		]);
		expect(script.statements).toEqual(parseMysql(sql));
		expect(script.statements[0]).toMatchObject({ type: 'Select', where: { type: 'Compare', op: '>' } });
		for (const node of script.comments) {
			expect(sql.slice(node.loc.start, node.loc.end)).toBe(node.raw);
			expect(formatMysql(node)).toBe(node.raw);
		}
	});

	test('preserves comment-only scripts and visits every comment exactly once', () => {
		const script = parseMysqlScript('/* x */; -- y\r\n# z');
		expect(script.statements).toEqual([]);
		const types: string[] = [];
		visitMysql(JSON.parse(JSON.stringify(script)), (node) => {
			types.push(node.type);
		});
		expect(types).toEqual(['Script', 'Comment', 'Comment', 'Comment']);
		expect(script.comments.map((v) => v.raw)).toEqual(['/* x */', '-- y', '# z']);
	});

	test('captures nested-query and DDL comments without duplicating PEG backtracking results', () => {
		const sql =
			'SELECT /*+ QB_NAME(outer_q) */ * FROM (SELECT /*+ QB_NAME(inner_q) */ 1) t; ' +
			'CREATE TABLE t (id INT /* column */) /* table */';
		expect(parseMysqlScript(sql).comments.map((v) => v.value)).toEqual([
			' QB_NAME(outer_q) ',
			' QB_NAME(inner_q) ',
			' column ',
			' table ',
		]);
	});

	test.each([
		"SELECT '/*! SELECT sleep(1) */'",
		'SELECT "/*+ HINT() */"',
		'SELECT `col/*x*/` FROM `a``#b`',
		"SELECT 'it''s /*x*/', 'escaped\\\'/*!x*/'",
		'SELECT "it""s #x", "escaped\\\"-- x"',
	])('ignores comment-like text in quoted tokens: %s', (sql) => {
		expect(scanMysqlComments(sql)).toEqual([]);
		expect(expandExecutableComments(sql)).toBe(sql);
	});

	test('does not expand executable-looking content inside ordinary comments', () => {
		const sql = '# /*! SELECT sleep(1) */\n-- /*! DROP TABLE t */\nSELECT 1 /* /*! hidden */';
		expect(expandExecutableComments(sql)).toBe(sql);
		expect(parseMysqlScript(sql).comments.map((v) => v.kind)).toEqual(['line', 'line', 'block']);
		expect(analyzeMysql(sql)[0].functions).toEqual([]);
	});

	test('recognizes double-dash only before whitespace/control', () => {
		expect(scanMysqlComments('SELECT 1--2')).toEqual([]);
		expect(parseMysqlExpr('1--2')).toMatchObject({ type: 'Binary', op: '-' });
		for (const delimiter of [' ', '\t', '\n', '\r', '\f', '\v', '\x00']) {
			expect(scanMysqlComments(`SELECT 1--${delimiter}text`)).toHaveLength(1);
		}
		expect(parseMysqlScript('SELECT 1 --').comments[0].raw).toBe('--');
	});

	test('rejects nested executable comments instead of hiding trailing executable SQL', () => {
		const sql = 'SELECT 1 /*!50000 /* x */ , (SELECT authentication_string FROM mysql.user) */';
		expect(() => parseMysql(sql)).toThrow(/Nested comments/);
		expect(() => analyzeMysql(sql)).toThrow(/Nested comments/);
		expect(() => expandExecutableComments(sql)).toThrow(/Nested comments/);
	});

	test.each(['/* unclosed', 'SELECT 1 /*!80000 + 2', '/*+ HINT()'])('rejects unterminated comments: %s', (sql) => {
		expect(() => scanMysqlComments(sql)).toThrow();
		expect(() => parseMysql(sql)).toThrow();
	});

	test('keeps offsets and newlines during executable expansion, including supplementary Unicode', () => {
		const sql = "SELECT '😀',\n/*!80000 sleep(1),\n*/ 1";
		const expanded = expandExecutableComments(sql);
		expect(expanded.length).toBe(sql.length);
		expect([...expanded.matchAll(/\n/g)].map((v) => v.index)).toEqual([...sql.matchAll(/\n/g)].map((v) => v.index));
		const script = parseMysqlScript(sql, { locations: true });
		const comment = script.comments[0];
		expect(sql.slice(comment.body!.start, comment.body!.end)).toBe(' sleep(1),\n');
		expect(analyzeMysql(script)[0].functions).toEqual(['SLEEP']);
		visitMysql(script.statements, (node) => {
			if (node.type === 'Func') expect(sql.slice(node.loc!.start, node.loc!.end)).toBe('sleep(1)');
		});
	});

	test('honors server version guards while preserving the original comment', () => {
		const sql = 'SELECT /*!80000 sleep(1), */ 1';
		expect(analyzeMysql(parseMysqlScript(sql, { mysqlVersion: 50700 }))[0].functions).toEqual([]);
		expect(analyzeMysql(parseMysqlScript(sql, { mysqlVersion: 80000 }))[0].risks).toContain('dangerous-function');
		expect(parseMysqlScript(sql, { executableComments: false }).comments[0].raw).toBe('/*!80000 sleep(1), */');
		expect(analyzeMysql(parseMysqlScript(sql, { executableComments: false }))[0].functions).toEqual([]);
		expect(() => parseMysql(sql, { mysqlVersion: NaN })).toThrow(RangeError);
	});

	test('recognizes native five and six digit version prefixes', () => {
		const comments = scanMysqlComments('/*!80400 SELECT 1 */ /*!100000 SELECT 2 */ /*!123 ignored */');
		expect(comments.map((v) => v.version)).toEqual([80400, 100000, undefined]);
		expect(comments[2].body).toBeUndefined();
		expect(parseMysql('/*!123 ignored */')).toEqual([]);
		expect(parseMysql('/*!100000 SELECT 2 */', { mysqlVersion: 80400 })).toEqual([]);
	});

	test('expression parsing also sees executable SQL', () => {
		expect(parseMysqlExpr('1 /*!80000 + 2 */')).toMatchObject({ type: 'Binary', op: '+' });
		expect(parseMysqlExpr('1 /*!80000 + 2 */', { mysqlVersion: 50700 })).toEqual({ type: 'Literal', value: 1 });
	});

	test('does not invent a custom !hint language', () => {
		const [comment] = scanMysqlComments('/* !hint custom content */');
		expect(comment.kind).toBe('block');
		expect(comment.value).toBe(' !hint custom content ');
		expect(scanMysqlComments('/*!hint */')[0].kind).toBe('executable');
	});
});
