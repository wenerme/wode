import { inspect } from 'node:util';
import { describe, expect, test } from 'vite-plus/test';
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
});
