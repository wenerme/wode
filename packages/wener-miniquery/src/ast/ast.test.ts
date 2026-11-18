import { inspect } from 'node:util';
import { describe, expect, test } from 'vitest';
import { formatQuery } from './formatQuery';
import { parseQuery } from './parseQuery';
import { resolveQuery } from './resolveQuery';

export const DemoQueryExamples = [
	'a=0',
	'a>0',
	'a>1',
	'!a>1',
	' a > 1 ',
	'a > 1 and b > "1" AND a > 1 or a > 1 OR a>1',
	'a > 1 && b > "1" and a > 1 || a > 1 || a>1',
	//
	'a is null AND a is not null',
	//
	'profile.age > 1',
	'profile.age between 18 and 28',
	'b between "a" and "z"',
	// json works as expected
	'attrs.test = true',
	'attrs.vendor.code = "wener"',
];

const SupportedQueryExamples = [
	//
	'a in []',
	'a in [1,"1",2,]',
	'a is true',
	'a is not true',
	'a is not false',
	'a is not null',
];

function createBuiltin({ now = () => new Date() }: { now?: () => Date } = {}) {
	return {
		get current_date() {
			return now().toISOString().slice(0, 10);
		},
		get current_timestamp() {
			return now().toISOString();
		},
		now() {
			return now().toISOString();
		},
		date: (v: any) => {
			if (v === null || v === undefined) {
				return null;
			}
			let date = new Date(v);
			if (Number.isNaN(date.getTime())) {
				console.error(`Invalid date: ${v}`);
				return null;
			}
			return date.toISOString().slice(0, 10);
		},
		length: (v: any) => {
			if (Array.isArray(v)) return v.length;
			if (typeof v === 'string') return v.length;
			return null;
		},
		upper: (v: any) => {
			if (typeof v === 'string') return v.toUpperCase();
			return null;
		},
		lower: (v: any) => {
			if (typeof v === 'string') return v.toLowerCase();
			return null;
		},
		nullif: (v: any, v2: any) => {
			if (v === v2) return null;
			return v;
		},
		coalesce: (...args: any[]) => {
			for (const arg of args) {
				if (arg != null) return arg;
			}
			return null;
		},
	};
}

const EvalData = {
	...createBuiltin({
		now: () => new Date('2023-02-01T04:05:06Z'),
	}),
	a: 1,
	s: 'Hello',
};
const EvalExamples: Array<[string] | [string, any]> = [
	// eval
	['1+1', 2],
	['1+2*3', 7],
	['(1+2)*3', 9],
	['a', 1],
	['"A"+"B" = "AB"'],
	// bool
	['1=1'],
	[' 0 = 0 '],
	['2 = 1+1'],
	['a < 0', false],
	['a = 1'],
	['a >1', false],
	['a in [1]'],
	['a between 0 and 1'],
	['a not between 0 and 2', false],
	['current_date = "2023-02-01"'],
	['s = "Hello"'],
	['!true', false],
	['!false'],
	['nullif(1,1) is null'],
	['nullif(1,2) is not null'],
	['coalesce(null, 1, 2)', 1],
	['coalesce(null, null, 2)', 2],
	['coalesce(null, null, null)', null],
	// func
	['current_date = date(current_timestamp)'],
	['length("Hello") = 5'],
	['length(s) = 5'],
	// case
	['case when 1=1 then 1 else 2 end = 1'],
	['case when 1=0 then 1 else 2 end = 2'],
	['case a when 1 then "A" when 2 then "B" else "" end = "A"'],
];

describe('ast', () => {
	const check = (a: string) => {
		let va = parseQuery(a);
		let b = formatQuery(va);
		let vb = parseQuery(b);

		try {
			expect(va).toMatchObject(vb);
		} catch (e) {
			console.error(`Error formatting: "${a}" -> "${b}"`);
			console.error(`Original AST:`, inspect(va, { depth: 5 }));
			console.error(`Formatted AST:`, inspect(vb, { depth: 5 }));
			throw e;
		}

		return va;
	};

	test('should parse', async () => {
		for (const a of DemoQueryExamples.concat(SupportedQueryExamples)) {
			try {
				check(a);
			} catch (e) {
				console.error(`Error parsing: "${a}"`, e);
				throw e;
			}
		}
	});

	test('should eval', async () => {
		for (const [expr, expected = true] of EvalExamples) {
			let ast = check(expr);
			let result = resolveQuery(ast, { context: EvalData });
			expect(result, `${expr} -> ${JSON.stringify(expected)}`).toEqual(expected);
		}
	});

	test('formats numbers without exponent notation', () => {
		for (const [input, expected] of [
			['0.0000001', '0.0000001'],
			['-0.00000012', '-0.00000012'],
			['1000000000000000000000', '1000000000000000000000'],
		] as const) {
			expect(formatQuery(parseQuery(input))).toBe(expected);
		}
		expect(formatQuery(parseQuery('-0'))).toBe('-0');
	});

	test('parenthesizes comparisons used as operands', () => {
		const nested = {
			type: 'compare',
			op: '=',
			left: { type: 'compare', op: '=', left: { type: 'ref', value: ['a'] }, right: { type: 'literal', value: 1 } },
			right: { type: 'literal', value: true },
		} as any;
		const text = formatQuery(nested);
		expect(text).toBe('(a = 1) = TRUE');
		expect(formatQuery(parseQuery(text))).toBe(text);
		const arithmetic = {
			type: 'binary',
			op: '+',
			left: nested.left,
			right: { type: 'literal', value: 2 },
		} as any;
		const arithmeticText = formatQuery(arithmetic);
		expect(arithmeticText).toBe('((a = 1) + 2)');
		expect(formatQuery(parseQuery(arithmeticText))).toBe(arithmeticText);
	});

	test('rejects expressions where MiniQuery only accepts values', () => {
		const item = {
			type: 'compare',
			op: '=',
			left: { type: 'ref', value: ['a'] },
			right: { type: 'literal', value: 1 },
		} as any;
		const inExpr = {
			type: 'compare',
			op: 'IN',
			left: { type: 'ref', value: ['x'] },
			right: { type: 'list', items: [item] },
		} as any;
		const betweenExpr = {
			type: 'compare',
			op: 'BETWEEN',
			left: { type: 'ref', value: ['x'] },
			right: { type: 'list', items: [item, { type: 'literal', value: 2 }] },
		} as any;
		expect(() => formatQuery(inExpr)).toThrow('IN/NOT IN items must be values');
		expect(() => formatQuery(betweenExpr)).toThrow('BETWEEN/NOT BETWEEN items must be values');
		expect(() => formatQuery({ type: 'func', name: 'f', args: [item] } as any)).toThrow(
			'Function arguments must be values',
		);
		expect(() => formatQuery({ type: 'list', items: [item] } as any)).toThrow('List items must be values');
		expect(() =>
			formatQuery({
				type: 'compare',
				op: 'LIKE',
				left: { type: 'ref', value: ['x'] },
				right: { type: 'ref', value: ['y'] },
			} as any),
		).toThrow('LIKE requires a string value');
		expect(() =>
			formatQuery({
				type: 'compare',
				op: 'IS',
				left: { type: 'ref', value: ['x'] },
				right: { type: 'ref', value: ['y'] },
			} as any),
		).toThrow('IS requires NULL or a boolean value');
		expect(() =>
			formatQuery({
				type: 'compare',
				op: 'ILIKE',
				left: { type: 'ref', value: ['x'] },
				right: { type: 'literal', value: 'y' },
			} as any),
		).toThrow('ILIKE is not supported');
		expect(() => formatQuery({ type: 'unary', op: '-', expr: { type: 'ref', value: ['x'] } } as any)).toThrow(
			'Unary operator - is not supported',
		);
		expect(formatQuery({ type: 'unary', op: '!', expr: { type: 'ref', value: ['x'] } } as any)).toBe('(NOT x)');
		expect(
			formatQuery({
				type: 'compare',
				op: '==',
				left: { type: 'ref', value: ['x'] },
				right: { type: 'literal', value: 1 },
			} as any),
		).toBe('x = 1');
		expect(() =>
			formatQuery({
				type: 'binary',
				op: 'XOR',
				left: { type: 'literal', value: true },
				right: { type: 'literal', value: false },
			} as any),
		).toThrow('Binary operator XOR is not supported');
		expect(() =>
			formatQuery({
				type: 'compare',
				op: 'OR',
				left: { type: 'literal', value: true },
				right: { type: 'literal', value: false },
			} as any),
		).toThrow('Comparison operator OR is not supported');
		expect(() => formatQuery({ type: 'logic', op: 'OR', exprs: [] } as any)).toThrow('at least two expressions');
		expect(() => formatQuery({ type: 'logic', op: 'OR', exprs: [{ type: 'literal', value: 3 }] } as any)).toThrow(
			'at least two expressions',
		);
		expect(() =>
			formatQuery({
				type: 'logic',
				op: 'AND',
				exprs: [
					{
						type: 'logic',
						op: 'AND',
						exprs: [
							{ type: 'literal', value: 1 },
							{ type: 'literal', value: 2 },
						],
					},
					{ type: 'literal', value: 3 },
				],
			} as any),
		).toThrow('Nested AND expressions');
		for (const text of ['a AND (b AND c)', 'a OR (b OR c)']) {
			expect(formatQuery(parseQuery(text))).toBe(`(${text})`);
		}
		expect(() =>
			formatQuery({
				type: 'logic',
				op: 'XOR',
				exprs: [
					{ type: 'literal', value: 1 },
					{ type: 'literal', value: 2 },
				],
			} as any),
		).toThrow('Logic operator XOR is not supported');
		expect(() => formatQuery({ type: 'case', cases: [], else: { type: 'literal', value: 1 } } as any)).toThrow(
			'at least one WHEN clause',
		);
		expect(() =>
			formatQuery({
				type: 'case',
				condition: false,
				cases: [{ when: { type: 'literal', value: true }, then: { type: 'literal', value: 1 } }],
				else: 0,
			} as any),
		).toThrow('Unknown type');
		expect(() => formatQuery({ type: 'ref', value: [] } as any)).toThrow('at least one name');
		const sparse = new Array(2);
		expect(() => formatQuery({ type: 'func', name: 'f', args: sparse } as any)).toThrow('must be dense');
		expect(() => formatQuery({ type: 'list', items: sparse } as any)).toThrow('must be dense');
		expect(() => formatQuery({ type: 'literal', value: [] } as any)).toThrow('Literal value is not supported');
	});
});
