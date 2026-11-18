import { expect, test } from 'vitest';
import { formatMysql, parseMysql, type ParseMysqlOptions } from './index';

function roundtrip(sql: string, options: ParseMysqlOptions = {}) {
	const ast = parseMysql(sql, options);
	expect(parseMysql(formatMysql(ast), options)).toEqual(ast);
	return ast;
}

test('index hints preserve identifier case, escaping, empty USE and scope', () => {
	expect(roundtrip('SELECT * FROM orders USE INDEX ()')[0]).toMatchObject({
		from: [{ indexHints: [{ kind: 'USE', indexes: [] }] }],
	});
	const ast = roundtrip(
		'SELECT * FROM orders FORCE INDEX FOR JOIN (`CaseIdx`, `a``b`) IGNORE KEY FOR ORDER BY (PRIMARY)',
	);
	expect(ast[0]).toMatchObject({
		from: [
			{
				indexHints: [
					{ kind: 'FORCE', scope: 'JOIN', indexes: ['CaseIdx', 'a`b'] },
					{ kind: 'IGNORE', scope: 'ORDER BY', indexes: ['PRIMARY'] },
				],
			},
		],
	});
});

test('outfile options are structured and preserve empty strings, case and escaping', () => {
	const ast = roundtrip(String.raw`SELECT id FROM orders INTO OUTFILE 'rows.csv'
CHARACTER SET utf8mb4 FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY ''
LINES STARTING BY 'MiXeD' TERMINATED BY '\n'`);
	expect(ast[0]).toMatchObject({
		into: {
			kind: 'OUTFILE',
			options: {
				kind: 'mysql',
				charset: 'utf8mb4',
				fields: { terminatedBy: ',', enclosedBy: '"', optionally: true, escapedBy: '' },
				lines: { startingBy: 'MiXeD', terminatedBy: '\n' },
			},
		},
	});
});

test('Doris outfile format and properties are structured', () => {
	const sql =
		"SELECT id FROM orders INTO OUTFILE 's3://bucket/' FORMAT AS csv PROPERTIES ('Key' = 'MiXeD', 'Escaped' = 'O''Brien')";
	expect(roundtrip(sql, { dialect: 'doris' })[0]).toMatchObject({
		into: {
			options: {
				kind: 'doris',
				format: 'CSV',
				properties: [
					{ name: 'Key', value: 'MiXeD' },
					{ name: 'Escaped', value: "O'Brien" },
				],
			},
		},
	});
	expect(() => parseMysql(sql)).toThrowError(expect.objectContaining({ name: 'SyntaxError' }));
});

test.each([
	'SELECT * FROM t FORCE INDEX ()',
	'SELECT * FROM t IGNORE INDEX ()',
	"SELECT 1 INTO OUTFILE 'x' FIELDS TERMINATED BY ',' TERMINATED BY ';'",
	"SELECT 1 INTO OUTFILE 'x' LINES STARTING BY 'a' STARTING BY 'b'",
	"SELECT 1 INTO DUMPFILE 'x' FIELDS TERMINATED BY ','",
])('rejects invalid or duplicate options: %s', (sql) => {
	expect(() => parseMysql(sql)).toThrowError(expect.objectContaining({ name: 'SyntaxError' }));
});
