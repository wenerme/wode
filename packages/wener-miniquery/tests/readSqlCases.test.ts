import { expect, test } from 'vitest';
import { parseSqlCases } from './readSqlCases';

const valid = '-- @case first\n-- @expect {"types":["Select"]}\nSELECT 1;\n';

test.each(['--  @case second', '--@case second', '  -- @case second', '-- @error'])(
	'rejects a misplaced or malformed directive instead of swallowing it: %s',
	(directive) => {
		expect(() => parseSqlCases(`${valid}${directive}\nSELECT 2;`, 'fixture.sql')).toThrow(/directive in SQL body/);
	},
);

test('rejects a malformed first header even when a later case is valid', () => {
	expect(() => parseSqlCases(`--@case lost\n${valid}`, 'fixture.sql')).toThrow(/before the first case/);
});

test('keeps semicolons and directive-like literals in the same SQL body', () => {
	const sql = "SELECT '; -- @case literal'; /* ; */ SELECT 2;";
	const cases = parseSqlCases(`-- @case multi\n-- @expect {"types":["Select","Select"]}\n${sql}`, 'fixture.sql');
	expect(cases).toHaveLength(1);
	expect(cases[0].sql).toBe(sql);
});
