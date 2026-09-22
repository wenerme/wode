import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';
import { formatSearch } from './formatSearch';
import { optimizeSearchExpr } from './optimizeSearchExpr';
import { parseSearch } from './parseSearch';
import type { SearchExpr } from './types';

describe('AdvanceSearch', () => {
	it('should parse', () => {
		for (const input of [
			//
			'-a',
			'a',
			'a b',
			'a -b',
			'a-b',
			'a"b',
			'a&b',
			'NOT a',
			'NOT -a',
			'HELLO -WORLD',
			'(a)',
			'( a OR B )',
			'A OR B',
			'a:[1,2]',
			'a:*..1',
			'a:ok a:=1 a:>1 a:<1 a:>=1 a:<=1 a:!=1 a:1..2 a:*..1 a:1..* a:[1,2] a:(1,2) a:[1,2) a:(1,2]',
			'NOT (A B) AND (a:ok AND size:>1)',
			'NOT -a',
			'NOT (NOT -a)',
			'owner:@me owner:=@me owner:!=@me',
			'@AI:"Where is my car"',
			'/**/ a',
			'/* Hint */ a',
			'/* a */ a /* b */',
		]) {
			let out = parseSearch(input);
			let formated = formatSearch(out);
			expect(formated, `reformat`).toMatchSnapshot();
			let optimized = formatSearch(optimizeSearchExpr(out));
			expect(optimized, `optimized`).toMatchSnapshot();
			expect(out, `parsed`).toMatchSnapshot();
			expect(parseSearch(formated), `reformat match original`).toMatchObject(out);
		}
	});
	it('should parse as expected', () => {
		type Case = [string | null | undefined, SearchExpr];

		const cases: Case[] = [
			[null, []],
			[undefined, []],
			['', []],
			// fast path
			['a', [{ type: 'keyword', value: 'a' }]],
			['a-b', [{ type: 'keyword', value: 'a-b' }]],
			['a"b', [{ type: 'keyword', value: 'a"b' }]],
			[
				'hello world',
				[
					{ type: 'keyword', value: 'hello' },
					{ type: 'keyword', value: 'world' },
				],
			],
			// advance
			['-a', [{ type: 'keyword', value: 'a', negative: true }]],
			[
				'/*Hi*/ hello -world',
				[
					{ type: 'comment', value: 'Hi' },
					{ type: 'keyword', value: 'hello', negative: false },
					{ type: 'keyword', value: 'world', negative: true },
				],
			],
			['"Hello"', [{ type: 'keyword', value: 'Hello', exact: true }]],
			['-"Hello"', [{ type: 'keyword', value: 'Hello', exact: true, negative: true }]],
			['is:ok', [{ type: 'compare', field: 'is', operator: 'match', value: { value: 'ok' } }]],
			['-is:ok', [{ type: 'compare', field: 'is', negative: true, operator: 'match', value: { value: 'ok' } }]],
		];

		for (const [input, expected] of cases) {
			let out = parseSearch(input);
			expect(out).toMatchObject(expected);
			expect(parseSearch(formatSearch(out)), 'reformat should match').toMatchObject(expected);
		}
	});

	it('should optimize simple', () => {
		type Case = { input: SearchExpr; expected: SearchExpr };
		const cases: Case[] = [
			// rm empty comment
			{
				input: [
					{ type: 'comment', value: '' },
					{ type: 'keyword', value: 'a' },
				],
				expected: [{ type: 'keyword', value: 'a' }],
			},
			// unwrap parentheses
			{
				input: [
					{ type: 'parentheses', value: [{ type: 'keyword', value: 'a' }] },
					{ type: 'keyword', value: 'b' },
				],
				expected: [
					{ type: 'keyword', value: 'a' },
					{ type: 'keyword', value: 'b' },
				],
			},
			// not not
			{
				input: [{ type: 'not', value: { type: 'not', value: { type: 'keyword', value: 'a' } } }],
				expected: [{ type: 'keyword', value: 'a', negative: false }],
			},
			// not to negative
			{
				input: [{ type: 'not', value: { type: 'keyword', value: 'a' } }],
				expected: [{ type: 'keyword', value: 'a', negative: true }],
			},
		];

		for (let i = 0; i < cases.length; i++) {
			const { input, expected } = cases[i];
			let out = optimizeSearchExpr(input);
			expect(out, `case #${i}`).toEqual(expected);
		}
	});

	it('should optimize by formated', () => {
		type Case = [string, string];

		const cases: Case[] = [
			['( a )', 'a'],
			['NOT a', '-a'],
			['NOT -a', 'a'],
			['NOT is:ok', '-is:ok'],
			['NOT -is:ok', 'is:ok'],
			['NOT -is:=ok', 'is:=ok'],
			['NOT is:=ok', 'is:!=ok'],
			['NOT (NOT -a)', '-a'],
		];

		for (const [input, expected] of cases) {
			let out = optimizeSearchExpr(parseSearch(input));
			expect(formatSearch(out), `${input} -> ${expected}: ${JSON.stringify(out)}`).toEqual(expected);
		}
	});

	it.fails('should parse parentheses', () => {
		let out = parseSearch('(a)');
		console.log(inspect(out, { depth: 10, colors: true }));
		expect(out).toEqual([{ type: 'parentheses', value: [{ type: 'keyword', value: 'a' }] }]);
	});
});
