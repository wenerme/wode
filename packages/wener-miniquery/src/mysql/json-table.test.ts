import { expect, test } from 'vitest';
import { formatMysql, type JsonTable, type Node, parseMysql, parseMysqlScript, visitMysql } from './index';

function jsonTable(sql: string): JsonTable {
	const [statement] = parseMysql(sql);
	if (statement.type !== 'Select' || statement.from?.[0].type !== 'JsonTable') {
		throw new Error('Expected a SELECT from JSON_TABLE');
	}
	return statement.from[0];
}

function roundtrip(sql: string) {
	const ast = parseMysql(sql);
	expect(parseMysql(formatMysql(ast))).toEqual(ast);
	return ast;
}

test('JSON_TABLE models each column kind and preserves names, JSON paths and defaults', () => {
	const sql = `SELECT * FROM JSON_TABLE(Source.Doc, '$.Rows[*]' COLUMNS (
		RowNo FOR ORDINALITY,
		Amount decimal(12, 3) PATH '$.Amount' DEFAULT '12.5' ON EMPTY ERROR ON ERROR,
		HasName int EXISTS PATH '$.Name',
		NESTED '$.Children[*]' COLUMNS (
			Name varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin PATH '$.Name'
				DEFAULT '\"MiXeD  Value\"' ON EMPTY NULL ON ERROR,
			NESTED PATH '$.Tags[*]' COLUMNS (Tag varchar(20) PATH '$')
		)
	)) AS ResultRows`;
	expect(jsonTable(sql)).toEqual({
		type: 'JsonTable',
		expr: { type: 'Column', table: 'Source', name: 'Doc' },
		path: '$.Rows[*]',
		alias: 'ResultRows',
		columns: [
			{ kind: 'ordinality', name: 'RowNo' },
			{
				kind: 'path',
				name: 'Amount',
				dataType: 'DECIMAL(12, 3)',
				path: '$.Amount',
				onEmpty: { action: 'DEFAULT', value: '12.5' },
				onError: { action: 'ERROR' },
			},
			{ kind: 'path', name: 'HasName', dataType: 'INT', path: '$.Name', exists: true },
			{
				kind: 'nested',
				path: '$.Children[*]',
				columns: [
					{
						kind: 'path',
						name: 'Name',
						dataType: 'VARCHAR(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin',
						path: '$.Name',
						onEmpty: { action: 'DEFAULT', value: '"MiXeD  Value"' },
						onError: { action: 'NULL' },
					},
					{
						kind: 'nested',
						path: '$.Tags[*]',
						columns: [{ kind: 'path', name: 'Tag', dataType: 'VARCHAR(20)', path: '$' }],
					},
				],
			},
		],
	});
	roundtrip(sql);
});

test.each([
	"SELECT * FROM JSON_TABLE('[1,2]', '$[*]' COLUMNS (n FOR ORDINALITY)) jt",
	"SELECT * FROM JSON_TABLE(JSON_ARRAY(1, 2), '$[*]' COLUMNS (n INT PATH '$')) jt",
	"SELECT * FROM JSON_TABLE(?, '$[*]' COLUMNS (n INT PATH '$')) jt",
	"SELECT * FROM JSON_TABLE(@Doc, '$[*]' COLUMNS (n INT PATH '$' NULL ON EMPTY)) jt",
	"SELECT * FROM JSON_TABLE(@Doc, '$[*]' COLUMNS (n INT EXISTS PATH '$' NULL ON EMPTY)) jt",
	"SELECT * FROM JSON_TABLE(@Doc, '$[*]' COLUMNS (n INT PATH '$' ERROR ON EMPTY)) jt",
	"SELECT * FROM JSON_TABLE(@Doc, '$[*]' COLUMNS (n INT PATH '$' DEFAULT 'null' ON ERROR)) jt",
	"SELECT * FROM JSON_TABLE(@Doc, '$[*]' COLUMNS (n INT PATH '$' NULL ON ERROR DEFAULT '0' ON EMPTY)) jt",
	"SELECT * FROM JSON_TABLE(@Doc, '$[*]' COLUMNS (`select` INT PATH '$', `a``b` FOR ORDINALITY)) AS `Rows Result`",
	"SELECT * FROM docs d JOIN JSON_TABLE(d.doc, '$[*]' COLUMNS (n INT PATH '$')) jt ON jt.n = d.id",
	"SELECT * FROM JSON_TABLE(@Doc, '$[*]' COLUMNS (n INT EXISTS PATH '$', NESTED PATH '$.a' COLUMNS (x INT PATH '$'), NESTED '$.b' COLUMNS (y INT PATH '$'))) jt",
])('JSON_TABLE roundtrip: %s', (sql) => {
	roundtrip(sql);
});

test('JSON_TABLE preserves JSON objects, SQL quote escapes and backslashes in nested defaults', () => {
	const sql = String.raw`SELECT * FROM JSON_TABLE('{"Rows":[{"Name":"MiXeD"}]}', '$.Rows[*]' COLUMNS (
		NESTED '$.Children[*]' COLUMNS (
			Value JSON PATH '$.Value' DEFAULT '{"Name":"O''Brien","Path":"C:\\\\MiXeD"}' ON EMPTY
		)
	)) jt`;
	const table = jsonTable(sql);
	expect(table.expr).toEqual({ type: 'Literal', value: '{"Rows":[{"Name":"MiXeD"}]}' });
	expect(table.columns[0]).toMatchObject({
		kind: 'nested',
		columns: [{ onEmpty: { action: 'DEFAULT', value: JSON.stringify({ Name: "O'Brien", Path: 'C:\\MiXeD' }) } }],
	});
	roundtrip(sql);
});

test('JSON_TABLE normalizes the legacy response order to ON EMPTY followed by ON ERROR', () => {
	const ast = roundtrip("SELECT * FROM JSON_TABLE(@d, '$' COLUMNS (v INT PATH '$' ERROR ON ERROR NULL ON EMPTY)) jt");
	expect(formatMysql(ast)).toContain('NULL ON EMPTY ERROR ON ERROR');
});

test.each([
	['decimal (10 , 2)', 'DECIMAL(10, 2)'],
	['bigint unsigned zerofill', 'BIGINT UNSIGNED ZEROFILL'],
	['varchar(30) character set Utf8mb4 collate Utf8mb4_Bin', 'VARCHAR(30) CHARACTER SET Utf8mb4 COLLATE Utf8mb4_Bin'],
	['char(10) binary', 'CHAR(10) BINARY'],
	['national varchar(20)', 'NATIONAL VARCHAR(20)'],
	['national char varying(20)', 'NATIONAL CHAR VARYING(20)'],
	['national character varying(20)', 'NATIONAL CHARACTER VARYING(20)'],
	['nchar varying(20)', 'NCHAR VARYING(20)'],
	['double precision', 'DOUBLE PRECISION'],
	['character varying(40)', 'CHARACTER VARYING(40)'],
	["enum('MiXeD', 'two  words')", "ENUM('MiXeD', 'two  words')"],
	['datetime(6)', 'DATETIME(6)'],
	['varchar(10) charset `Utf8mb4`', 'VARCHAR(10) CHARACTER SET `Utf8mb4`'],
])('JSON_TABLE bounds datatype %s at PATH and EXISTS', (source, expected) => {
	for (const exists of ['', 'EXISTS ']) {
		const sql = `SELECT * FROM JSON_TABLE(@Doc, '$' COLUMNS (Value ${source} ${exists}PATH '$.Value')) jt`;
		expect(jsonTable(sql).columns[0]).toMatchObject({ dataType: expected, path: '$.Value' });
		roundtrip(sql);
	}
});

test('JSON_TABLE accepts comments between tokens and keeps comment offsets', () => {
	const sql = `SELECT * FROM JSON_TABLE /* call */ (
		@Doc, '$[*]' COLUMNS /* columns */ (
			n FOR /* ordinal */ ORDINALITY,
			v DECIMAL /* precision */ (10, 2) PATH /* path */ '$.Value'
				DEFAULT /* default */ '1' ON /* response */ EMPTY,
			NESTED /* nested */ PATH '$.Rows[*]' COLUMNS (v INT PATH '$')
		)
	) /* alias */ AS RowSet`;
	const script = parseMysqlScript(sql, { locations: true });
	expect(script.comments).toHaveLength(9);
	for (const comment of script.comments) {
		expect(sql.slice(comment.loc.start, comment.loc.end)).toBe(comment.raw);
	}
	const table = (script.statements[0] as { from: JsonTable[] }).from[0];
	expect(sql.slice(table.loc!.start, table.loc!.end)).toBe(sql.slice(sql.indexOf('JSON_TABLE')));
	expect(table.expr.loc).toBeDefined();
	roundtrip(sql);
});

test('JSON_TABLE traverses its input expressions and subqueries without treating column records as nodes', () => {
	const sql = `SELECT * FROM JSON_TABLE(
		JSON_EXTRACT((SELECT payload FROM source_docs WHERE id = ?), '$.Rows'),
		'$[*]' COLUMNS (n INT PATH '$', NESTED '$.Nested' COLUMNS (v VARCHAR(10) PATH '$'))
	) jt`;
	const ast = roundtrip(sql);
	const visited: Array<{ node: Node; parent?: Node }> = [];
	visitMysql(ast, (node, parent) => {
		visited.push({ node, parent });
	});
	expect(visited.filter(({ node }) => node.type === 'JsonTable')).toHaveLength(1);
	expect(visited.filter(({ node }) => node.type === 'Select')).toHaveLength(2);
	expect(visited).toContainEqual({
		node: expect.objectContaining({ type: 'Func', name: 'JSON_EXTRACT' }),
		parent: expect.objectContaining({ type: 'JsonTable' }),
	});
	expect(visited.map(({ node }) => node)).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ type: 'Table', name: 'source_docs' }),
			expect.objectContaining({ type: 'Column', name: 'payload' }),
			expect.objectContaining({ type: 'Param', index: 0 }),
		]),
	);
	expect(
		visited.every(({ node }) => !('kind' in node && ['path', 'nested', 'ordinality'].includes(node.kind as string))),
	).toBe(true);
});

test.each([
	"JSON_TABLE(@d, '$' COLUMNS (n INT PATH '$'))",
	"JSON_TABLE(@d, '$' COLUMNS ()) jt",
	"JSON_TABLE(@d, '$' COLUMNS (NESTED '$.x' COLUMNS ())) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT PATH '$',)) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n PATH '$')) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT EXISTS '$')) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT PATH '$' NULL ON EMPTY ERROR ON EMPTY)) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT PATH '$' NULL ON ERROR ERROR ON ERROR)) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT PATH '$' NULL ON EMPTY ERROR ON ERROR NULL ON EMPTY)) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT PATH '$' DEFAULT 0 ON EMPTY)) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n FOR ORDINALITY NULL ON EMPTY)) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT ON EMPTY PATH '$')) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT PATHX '$')) jt",
	"JSON_TABLE(@d, '$' COLUMNS (n INT EXISTSX PATH '$')) jt",
	'JSON_TABLE(@d) jt',
	'JSON_TABLE jt',
])('rejects malformed JSON_TABLE without generic fallback: %s', (table) => {
	expect(() => parseMysql(`SELECT * FROM ${table}`)).toThrow(SyntaxError);
});

test('JSON_TABLE dispatch is MySQL-only and respects the keyword boundary', () => {
	const sql = "SELECT * FROM JSON_TABLE(@d, '$' COLUMNS (n INT PATH '$')) jt";
	expect(() => parseMysql(sql, { dialect: 'doris' })).toThrow(SyntaxError);
	const generic = 'SELECT * FROM JSON_TABLE(@d) jt';
	const ast = parseMysql(generic, { dialect: 'doris' });
	expect(ast[0]).toMatchObject({ from: [{ type: 'TableFunc', func: { name: 'JSON_TABLE' } }] });
	expect(parseMysql(formatMysql(ast), { dialect: 'doris' })).toEqual(ast);
	roundtrip('SELECT * FROM JSON_TABLE_ROWS');
	roundtrip('SELECT * FROM `JSON_TABLE`');
});
