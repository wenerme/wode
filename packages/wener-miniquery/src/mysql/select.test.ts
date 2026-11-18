import { describe, expect, test } from 'vitest';
import {
	analyzeMysql,
	formatMysql,
	parseMysql,
	parseMysqlExpr,
	visitMysql,
	type ParseMysqlOptions,
	type QueryStatement,
} from './index';

function query(sql: string, options: ParseMysqlOptions = {}): QueryStatement {
	const statements = parseMysql(sql, options);
	expect(statements).toHaveLength(1);
	const q = statements[0];
	if (q.type !== 'Select' && q.type !== 'SetOp' && q.type !== 'QueryGroup') throw new Error('Expected query');
	return q;
}

function roundtrip(sql: string, options: ParseMysqlOptions = {}) {
	const ast = query(sql, options);
	expect(query(formatMysql(ast), options)).toEqual(ast);
	return ast;
}

function shape(q: QueryStatement): unknown {
	if (q.type === 'QueryGroup') return shape(q.query);
	if (q.type === 'SetOp') return [q.op, shape(q.left), shape(q.right)];
	return q.columns.map((column) => (column.expr.type === 'Literal' ? column.expr.value : column.expr.type));
}

describe('SELECT query structure', () => {
	test.each([
		['SELECT 1 UNION SELECT 2 INTERSECT SELECT 3', ['UNION', [1], ['INTERSECT', [2], [3]]]],
		['SELECT 1 EXCEPT SELECT 2 INTERSECT SELECT 3', ['EXCEPT', [1], ['INTERSECT', [2], [3]]]],
		['SELECT 1 INTERSECT SELECT 2 UNION SELECT 3', ['UNION', ['INTERSECT', [1], [2]], [3]]],
		['SELECT 1 EXCEPT SELECT 2 UNION SELECT 3', ['UNION', ['EXCEPT', [1], [2]], [3]]],
		['(SELECT 1 UNION SELECT 2) INTERSECT SELECT 3', ['INTERSECT', ['UNION', [1], [2]], [3]]],
		['SELECT 1 EXCEPT (SELECT 2 EXCEPT SELECT 3)', ['EXCEPT', [1], ['EXCEPT', [2], [3]]]],
	])('preserves set precedence: %s', (sql, expected) => {
		expect(shape(roundtrip(sql as string))).toEqual(expected);
	});

	test('preserves both inner and outer ordering and limits', () => {
		const ast = roundtrip('(SELECT a, b FROM t ORDER BY a LIMIT 1) ORDER BY b LIMIT 2');
		expect(ast).toMatchObject({
			type: 'QueryGroup',
			query: { type: 'Select', orderBy: [{ expr: { name: 'a' } }], limit: { count: { value: 1 } } },
			orderBy: [{ expr: { name: 'b' } }],
			limit: { count: { value: 2 } },
		});
	});

	test('preserves nested set tails at every level', () => {
		const ast = roundtrip('((SELECT 1 UNION SELECT 2 ORDER BY 1 LIMIT 1) LIMIT 5) LIMIT 10');
		expect(ast).toMatchObject({
			type: 'QueryGroup',
			limit: { count: { value: 10 } },
			query: {
				type: 'QueryGroup',
				limit: { count: { value: 5 } },
				query: { type: 'SetOp', limit: { count: { value: 1 } } },
			},
		});
	});

	test('preserves query group locations and both CTE scopes', () => {
		const sql =
			'WITH c AS (SELECT * FROM source_a) (WITH c AS (SELECT * FROM source_b) SELECT * FROM c LIMIT 1) LIMIT 2';
		const ast = query(sql, { locations: true });
		expect(ast).toMatchObject({
			type: 'QueryGroup',
			with: { ctes: [{ name: 'c' }] },
			query: { with: { ctes: [{ name: 'c' }] } },
		});
		expect(sql.slice(ast.loc!.start, ast.loc!.end)).toContain('(WITH c');
		expect(analyzeMysql(ast)[0].tables).toEqual([
			{ name: 'source_a', access: 'read' },
			{ name: 'source_b', access: 'read' },
		]);
		roundtrip(sql);
	});

	test('formats synthetic set trees using semantic parentheses', () => {
		const ast = query('(SELECT 1 UNION SELECT 2) INTERSECT SELECT 3');
		if (ast.type !== 'SetOp' || ast.left.type !== 'QueryGroup') throw new Error('Expected grouped operand');
		ast.left = ast.left.query;
		expect(shape(query(formatMysql(ast)))).toEqual(['INTERSECT', ['UNION', [1], [2]], [3]]);
		expect(formatMysql(ast)).toContain('(SELECT 1 UNION SELECT 2) INTERSECT');
	});

	test('query locations include their own tail and keep intermediate set operands bounded', () => {
		const sql = 'SELECT 1 UNION SELECT 2 UNION SELECT 3';
		const ast = query(sql, { locations: true });
		if (ast.type !== 'SetOp') throw new Error('Expected set');
		expect(sql.slice(ast.left.loc!.start, ast.left.loc!.end).trim()).toBe('SELECT 1 UNION SELECT 2');
		for (const source of ['(SELECT 1) ORDER BY 1 LIMIT 2', 'WITH c AS (SELECT 1) (SELECT * FROM c) LIMIT 2']) {
			const result = query(source, { locations: true });
			expect(result.loc).toEqual({ start: 0, end: source.length });
		}
	});
});

describe('SELECT INTO placement', () => {
	test.each([
		'SELECT id INTO @id FROM orders ORDER BY id LIMIT 1',
		'SELECT id FROM orders ORDER BY id LIMIT 1 INTO @id',
		'SELECT id FROM orders INTO @id FOR UPDATE',
		'SELECT id FROM orders FOR UPDATE INTO @id',
		"SELECT id FROM orders ORDER BY id LIMIT 1 INTO OUTFILE 'rows.csv' FIELDS TERMINATED BY ','",
		'(SELECT id FROM orders LIMIT 1) LIMIT 2 INTO @id',
		'SELECT 1 UNION SELECT 2 INTO @x',
		'(SELECT 1 INTO @x)',
		// MySQL 8.4 accepts INTO in the last query block (deprecated, warning 3962)
		'SELECT 1 UNION SELECT 2 INTO @x ORDER BY 1',
		'SELECT 1 UNION (SELECT 2 INTO @x) ORDER BY 1',
		'SELECT 1 UNION (SELECT 2 INTO @x)',
		'(SELECT 1 INTO @x) ORDER BY 1',
		'(SELECT 1 UNION SELECT 2 INTO @x) LIMIT 1',
	])('supports a unique INTO clause: %s', (sql) => {
		roundtrip(sql);
	});

	test('attaches the destination to the entire set expression', () => {
		const ast = roundtrip("SELECT id FROM a UNION SELECT id FROM b ORDER BY id LIMIT 1 INTO OUTFILE 'rows.csv'");
		expect(ast).toMatchObject({ type: 'SetOp', into: { kind: 'OUTFILE', file: 'rows.csv' } });
		if (ast.type !== 'SetOp') throw new Error('Expected set');
		expect(ast.right.into).toBeUndefined();
		expect(analyzeMysql(ast)[0].risks).toEqual(['into-file']);
	});

	// MySQL applies the destination to the final result: `(SELECT 1 UNION SELECT 8 INTO @x)
	// ORDER BY 1 DESC LIMIT 1` assigns 8, so INTO belongs to the outermost query node.
	test('hoists INTO from the last query block to the outermost query', () => {
		const ast = roundtrip('(SELECT 1 UNION SELECT 8 INTO @x) ORDER BY 1 DESC LIMIT 1');
		expect(ast).toMatchObject({ type: 'QueryGroup', into: { kind: 'VAR', vars: [{ name: 'x' }] } });
		if (ast.type !== 'QueryGroup' || ast.query.type !== 'SetOp') throw new Error('Expected grouped set');
		expect(ast.query.into).toBeUndefined();
		expect(ast.query.right.into).toBeUndefined();
		expect(formatMysql(ast)).toBe('(SELECT 1 UNION SELECT 8) ORDER BY 1 DESC LIMIT 1 INTO @x');
	});

	test.each([
		'SELECT id INTO @a FROM orders INTO @b',
		'SELECT id INTO @a FROM orders ORDER BY id LIMIT 1 INTO @b',
		'SELECT id FROM orders INTO @a FOR UPDATE INTO @b',
		'(SELECT 1 INTO @a) INTO @b',
		'SELECT 1 INTO @a UNION SELECT 2',
		'SELECT 1 UNION SELECT 2 INTO @a INTO @b',
		'SELECT (SELECT 1 INTO @a)',
		'SELECT * FROM (SELECT 1 INTO @a) t',
		'WITH c AS (SELECT 1 INTO @a) SELECT * FROM c',
		// INTO in a query block other than the last one (MySQL error 3954)
		'SELECT 1 UNION SELECT 2 INTO @x UNION SELECT 3',
		'(SELECT 1 INTO @x) UNION SELECT 2',
		'SELECT (SELECT 1 UNION SELECT 2 INTO @x)',
	])('rejects duplicate or misplaced INTO: %s', (sql) => {
		expect(() => parseMysql(sql)).toThrowError(expect.objectContaining({ name: 'SyntaxError' }));
	});
});

describe('window frames and locking', () => {
	test('structures frame boundaries and preserves lock identifier spelling', () => {
		const ast = roundtrip(
			'SELECT SUM(x) OVER (ORDER BY id ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) FROM orders AS Mixed FOR UPDATE OF Mixed SKIP LOCKED',
		);
		expect(ast).toMatchObject({
			columns: [
				{
					expr: {
						over: {
							frame: {
								unit: 'ROWS',
								start: { kind: 'offset', direction: 'PRECEDING', value: { type: 'Literal', value: 1 } },
								end: { kind: 'current' },
							},
						},
					},
				},
			],
			locking: [{ mode: 'UPDATE', tables: [{ name: 'Mixed' }], wait: 'SKIP LOCKED' }],
		});
		expect(formatMysql(ast)).toContain('OF Mixed');
	});

	test.each([
		'SELECT SUM(x) OVER (ORDER BY d RANGE BETWEEN INTERVAL 1 DAY PRECEDING AND CURRENT ROW) FROM t',
		'SELECT SUM(x) OVER (ROWS ? PRECEDING) FROM t',
		'SELECT SUM(x) OVER (ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING) FROM t',
		'SELECT SUM(x) OVER (ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) FROM t',
		'SELECT * FROM a JOIN b USING (id) FOR UPDATE OF a NOWAIT FOR SHARE OF b SKIP LOCKED',
		'SELECT * FROM db.Mixed FOR UPDATE OF db.Mixed.* NOWAIT',
		'SELECT * FROM a LOCK IN SHARE MODE',
		'SELECT SUM(x) OVER (`rows`) FROM t WINDOW `rows` AS ()',
		'SELECT SUM(x) OVER (`range`) FROM t WINDOW `range` AS ()',
	])('roundtrips structured clauses: %s', (sql) => {
		roundtrip(sql);
	});

	test('visitor reaches window bound expressions', () => {
		const ast = query('SELECT SUM(x) OVER (ORDER BY d RANGE INTERVAL 2 DAY PRECEDING) FROM t');
		const seen: string[] = [];
		visitMysql(ast, (node) => {
			seen.push(node.type);
		});
		expect(seen).toContain('Interval');
		expect(seen).toContain('Literal');
	});

	test.each([
		'SELECT SUM(x) OVER (ROWS UNBOUNDED FOLLOWING) FROM t',
		'SELECT SUM(x) OVER (ROWS BETWEEN CURRENT ROW AND UNBOUNDED PRECEDING) FROM t',
		'SELECT SUM(x) OVER (ROWS 1 FOLLOWING) FROM t',
		'SELECT SUM(x) OVER (ROWS BETWEEN CURRENT ROW AND 1 PRECEDING) FROM t',
		'SELECT SUM(x) OVER (ROWS INTERVAL 1 DAY PRECEDING) FROM t',
		'SELECT SUM(x) OVER (ROWS @n PRECEDING) FROM t',
		'SELECT * FROM t FOR UPDATE NOWAIT SKIP LOCKED',
		'SELECT * FROM t FOR UPDATE FOR SHARE',
		'SELECT * FROM t FOR UPDATE OF t FOR SHARE OF t',
		'SELECT * FROM t FOR UPDATE OF t, t',
		'SELECT 1 UNION SELECT 2 FOR UPDATE',
	])('rejects malformed frame/lock clauses: %s', (sql) => {
		expect(() => parseMysql(sql)).toThrowError(expect.objectContaining({ name: 'SyntaxError' }));
	});
});

describe('parameter numbering after PEG backtracking', () => {
	test.each([
		'SELECT (?), ?',
		"SELECT * FROM JSON_TABLE((?), '$' COLUMNS (a INT PATH '$')) jt WHERE a = ?",
		'SELECT SUM(x) OVER (RANGE INTERVAL (?) DAY PRECEDING), ?',
		'WITH c AS (SELECT (?)) SELECT ? FROM c',
		'SELECT (?) UNION SELECT ?',
		'SELECT 1 LIMIT ?, ?',
		'SELECT 1 LIMIT ? OFFSET ?',
		"SELECT '?' AS literal, (?) /* ? */; SELECT ?",
	])('numbers retained parameters in source order: %s', (sql) => {
		const ast = parseMysql(sql);
		const params: Array<{ index: number; start: number }> = [];
		visitMysql(parseMysql(sql, { locations: true }), (node) => {
			if (node.type === 'Param') params.push({ index: node.index, start: node.loc!.start });
		});
		expect(params.sort((a, b) => a.start - b.start).map((p) => p.index)).toEqual([0, 1]);
		expect(parseMysql(formatMysql(ast))).toEqual(ast);
		expect(parseMysql(sql)).toEqual(ast);
	});

	test('expression entry point also numbers retained parameters', () => {
		const expr = parseMysqlExpr('(?) + ?');
		expect(expr).toMatchObject({ left: { type: 'Param', index: 0 }, right: { type: 'Param', index: 1 } });
		expect(parseMysqlExpr(formatMysql(expr))).toEqual(expr);
	});

	test('numbering does not overflow on deep expression chains', () => {
		const chain = Array.from({ length: 30000 }, (_, i) => (i % 2 ? '?' : '1')).join(' + ');
		expect(parseMysqlExpr(chain)).toMatchObject({ type: 'Binary', right: { type: 'Param', index: 14999 } });
		expect(parseMysql(`SELECT ${chain}`)).toHaveLength(1);
	});
});

describe('Doris QUALIFY', () => {
	test('retains the filter as an expression and rejects it in MySQL', () => {
		const sql = 'SELECT ROW_NUMBER() OVER (ORDER BY id) AS rn FROM orders QUALIFY rn = 1 ORDER BY id LIMIT 5';
		expect(roundtrip(sql, { dialect: 'doris' })).toMatchObject({
			qualify: {
				type: 'Compare',
				op: '=',
				left: { type: 'Column', name: 'rn' },
				right: { type: 'Literal', value: 1 },
			},
		});
		expect(() => parseMysql(sql)).toThrowError(expect.objectContaining({ name: 'SyntaxError' }));
	});

	test.each([
		'SELECT id FROM orders QUALIFY',
		'SELECT id FROM orders ORDER BY id QUALIFY id = 1',
		'SELECT id FROM orders QUALIFY id = 1 QUALIFY id = 2',
	])('rejects malformed QUALIFY: %s', (sql) => {
		expect(() => parseMysql(sql, { dialect: 'doris' })).toThrowError(expect.objectContaining({ name: 'SyntaxError' }));
	});
});
