import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { formatQuery, parseQuery, resolveQuery } from '../src/ast';
import type { Expr as MiniQueryExpr } from '../src/ast';
import { visit } from '../src/ast/visit';
import {
	analyzeMysql,
	formatMysql,
	parseMysqlScript,
	visitMysql,
	type CommentNode,
	type MysqlDialect,
	type MysqlRisk,
	type MysqlTableAccess,
	type Node,
	type ParseMysqlOptions,
} from '../src/mysql';
import { readSqlCases } from './readSqlCases';

type SqlExpectation = {
	types: string[];
	tables?: MysqlTableAccess[];
	risks?: MysqlRisk[];
	functions?: string[];
	comments?: Array<CommentNode['kind']>;
};

// Compile-time exhaustiveness: adding an AST node requires a fixture covering it.
const sqlNodeTypes = {
	Array: true,
	Between: true,
	Binary: true,
	Case: true,
	Cast: true,
	Collate: true,
	Column: true,
	Compare: true,
	Exists: true,
	Func: true,
	GroupingSets: true,
	In: true,
	Interval: true,
	Keyword: true,
	Lambda: true,
	Literal: true,
	Logic: true,
	Match: true,
	Param: true,
	Row: true,
	Star: true,
	Subquery: true,
	Subscript: true,
	Unary: true,
	Var: true,
	Select: true,
	SetOp: true,
	QueryGroup: true,
	Insert: true,
	Update: true,
	Delete: true,
	Use: true,
	Set: true,
	Explain: true,
	Describe: true,
	Drop: true,
	Truncate: true,
	Create: true,
	CreateIndex: true,
	AlterTable: true,
	LoadData: true,
	Rename: true,
	LockTables: true,
	Unknown: true,
	Table: true,
	Derived: true,
	TableFunc: true,
	JsonTable: true,
	Join: true,
	Script: true,
	Comment: true,
} satisfies Record<Node['type'], true>;

/**
 * MySQL keeps valid and rejected statements in separate files, so each file has a
 * single kind of expectation; Doris cases stay together with their MySQL rejections.
 */
const sqlFixtureFiles: Array<{ file: string; dialect: MysqlDialect; kind?: 'valid' | 'error' }> = [
	{ file: 'test.mysql.sql', dialect: 'mysql', kind: 'valid' },
	{ file: 'error.test.mysql.sql', dialect: 'mysql', kind: 'error' },
	{ file: 'test.doris.sql', dialect: 'doris' },
];

function readSqlFixtures(file: string) {
	return readSqlCases<SqlExpectation, ParseMysqlOptions>(new URL(`./${file}`, import.meta.url));
}

test('MySQL valid and error fixtures stay in their own files', () => {
	const names = new Set<string>();
	for (const { file, kind } of sqlFixtureFiles) {
		for (const fixture of readSqlFixtures(file)) {
			if (kind) expect(fixture.error, `${file}: ${fixture.name}`).toBe(kind === 'error');
			expect(names.has(fixture.name), `duplicate case name ${fixture.name}`).toBe(false);
			names.add(fixture.name);
		}
	}
});

for (const { file, dialect } of sqlFixtureFiles) {
	const cases = readSqlFixtures(file);
	describe(file, () => {
		test.each(cases)('$name (line $line)', (fixture) => {
			const options = { ...fixture.options, dialect };
			expect(Object.keys(fixture.options).filter((v) => !['mysqlVersion', 'executableComments'].includes(v))).toEqual(
				[],
			);
			if (fixture.error) {
				expect(() => parseMysqlScript(fixture.sql, options)).toThrowError(
					expect.objectContaining({ name: 'SyntaxError' }),
				);
				return;
			}
			const expected = fixture.expect!;
			expect(
				Object.keys(expected).filter((v) => !['types', 'tables', 'risks', 'functions', 'comments'].includes(v)),
			).toEqual([]);
			expect(Array.isArray(expected.types), 'positive SQL cases must assert statement types').toBe(true);
			const script = parseMysqlScript(fixture.sql, options);
			expect(script.statements.map((s) => s.type)).toEqual(expected.types);
			const analysis = analyzeMysql(script);
			if (expected.tables) expect(analysis.flatMap((s) => s.tables)).toEqual(expected.tables);
			if (expected.risks) expect(analysis.flatMap((s) => s.risks)).toEqual(expected.risks);
			if (expected.functions) expect(analysis.flatMap((s) => s.functions)).toEqual(expected.functions);
			if (expected.comments) expect(script.comments.map((s) => s.kind)).toEqual(expected.comments);
			for (const comment of script.comments) {
				expect(fixture.sql.slice(comment.loc.start, comment.loc.end)).toBe(comment.raw);
				expect(formatMysql(comment)).toBe(comment.raw);
			}
			// Only semantic statements are formatted; relocating hints or version guards is unsafe.
			const formatted = formatMysql(script.statements);
			expect(parseMysqlScript(formatted, options).statements, formatted).toEqual(script.statements);
			if (fixture.mysqlReject) {
				expect(dialect).toBe('doris');
				expect(() => parseMysqlScript(fixture.sql, { ...options, dialect: 'mysql' })).toThrowError(
					expect.objectContaining({ name: 'SyntaxError' }),
				);
			}
		});
	});
}

test('SQL fixtures cover every implemented AST node family', () => {
	const seenSqlNodes = new Set<string>();
	for (const { file, dialect } of sqlFixtureFiles) {
		for (const fixture of readSqlFixtures(file).filter((v) => !v.error)) {
			visitMysql(parseMysqlScript(fixture.sql, { ...fixture.options, dialect }), (node) => {
				seenSqlNodes.add(node.type);
			});
		}
	}
	expect([...seenSqlNodes].sort()).toEqual(Object.keys(sqlNodeTypes).sort());
});

test.each(['LOW_PRIORITY', 'CONCURRENT'])(
	'LOAD DATA preserves %s and IGNORE independently of its raw options',
	(priority) => {
		const sql = `LOAD DATA ${priority} INFILE 'rows.csv' IGNORE INTO TABLE rows_import IGNORE 1 LINES`;
		expect(parseMysqlScript(sql).statements).toMatchObject([
			{ type: 'LoadData', priority, ignore: true, options: 'IGNORE 1 LINES' },
		]);
	},
);

type MiniQueryExpectation = {
	type: MiniQueryExpr['type'];
	value?: unknown;
	context?: Record<string, unknown>;
	evaluationError?: string;
};
const miniquery = readSqlCases<MiniQueryExpectation>(new URL('./test.miniquery.sql', import.meta.url));
describe('test.miniquery.sql', () => {
	test.each(miniquery)('$name (line $line)', (fixture) => {
		expect(fixture.options).toEqual({});
		expect(fixture.mysqlReject).toBe(false);
		if (fixture.error) {
			expect(() => parseQuery(fixture.sql)).toThrowError(expect.objectContaining({ name: 'SyntaxError' }));
			return;
		}
		const expected = fixture.expect!;
		expect(Object.keys(expected).filter((v) => !['type', 'value', 'context', 'evaluationError'].includes(v))).toEqual(
			[],
		);
		const ast = parseQuery(fixture.sql);
		expect(ast.type).toBe(expected.type);
		expect(parseQuery(formatQuery(ast))).toEqual(ast);
		if (Object.hasOwn(expected, 'value')) {
			expect(resolveQuery(ast, { context: expected.context ?? {} })).toEqual(expected.value);
		}
		if (expected.evaluationError) {
			expect(() => resolveQuery(ast, { context: expected.context ?? {} })).toThrow(expected.evaluationError);
		}
	});
});

test('MiniQuery fixtures cover every expression node family', () => {
	const seenMiniQueryNodes = new Set<string>();
	for (const fixture of miniquery.filter((v) => !v.error)) {
		visit(parseQuery(fixture.sql), (node) => {
			seenMiniQueryNodes.add(node.type);
			return undefined;
		});
	}
	const types = {
		binary: true,
		case: true,
		compare: true,
		func: true,
		list: true,
		literal: true,
		logic: true,
		ref: true,
		unary: true,
	} satisfies Record<MiniQueryExpr['type'], true>;
	expect([...seenMiniQueryNodes].sort()).toEqual(Object.keys(types).sort());
});

test.each(['ast', 'search', 'mikro-orm', 'mysql/ast'])('%s parser is generated with Peggy 5.1.1', (module) => {
	const generated = readFileSync(new URL(`../src/${module}/parser.js`, import.meta.url), 'utf8');
	expect(generated).toContain('// @generated by Peggy 5.1.1.');
});
