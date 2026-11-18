import { describe, expect, test } from 'vitest';
import { formatQuery, parseQuery, resolveQuery } from '../ast';
import type { Expr } from '../ast/types';
import { CommentKey, DisableKey, documentQueryToExpr, formatDocumentQuery } from './index';
import type { AnyDocumentQuery, DocumentQuery } from './types';

interface User {
	id: number;
	name: string;
	status: 'active' | 'inactive';
	tags: string[];
	profile: { age: number; email?: string; address?: { city: string } };
	created: Date;
}

const format = (q: AnyDocumentQuery | null | undefined) => formatDocumentQuery(q).join(' AND ');

describe('formatDocumentQuery', () => {
	test('keeps the legacy root list form', () => {
		expect(formatDocumentQuery([{ a: 1 }, { b: 2 }])).toEqual(['a = 1', 'b = 2']);
		const disabled = Object.assign(new Array<{ a: number }>(), { $$disable: true });
		Object.defineProperty(disabled, 0, {
			get() {
				throw new Error('disabled root list was read');
			},
		});
		expect(formatDocumentQuery(disabled as unknown as AnyDocumentQuery[])).toEqual([]);
	});

	test.each<[AnyDocumentQuery | null | undefined, string]>([
		[null, ''],
		[undefined, ''],
		[{}, ''],
		// values and comparisons
		[{ status: 1 }, 'status = 1'],
		[{ status: { $eq: 1 } }, 'status = 1'],
		[{ a: { $ne: 'test' } }, 'a != "test"'],
		[{ a: { $gt: 10, $lte: 20 } }, 'a > 10 AND a <= 20'],
		[{ a: { $gt: -1.5 } }, 'a > -1.5'],
		[{ a: true }, 'a = TRUE'],
		[{ created: new Date('2024-01-01T00:00:00Z') }, 'created = "2024-01-01T00:00:00.000Z"'],
		[{ a: 10n }, 'a = 10'],
		// strings have no escapes in MiniQuery: the other quote character is used
		[{ a: 'say "hi"' }, `a = 'say "hi"'`],
		[{ a: "it's" }, 'a = "it\'s"'],
		[{ a: 'x\ny' }, 'a = "x\ny"'],
		// null follows SQL
		[{ a: null }, 'a IS NULL'],
		[{ a: { $eq: null } }, 'a IS NULL'],
		[{ a: { $ne: null } }, 'a IS NOT NULL'],
		[{ name: { $exists: true } }, 'name IS NOT NULL'],
		[{ name: { $exists: false } }, 'name IS NULL'],
		// lists
		[{ a: [1, 2, 3] }, 'a IN (1, 2, 3)'],
		[{ a: { $in: [1, 2, 3] } }, 'a IN (1, 2, 3)'],
		[{ a: { $nin: [1, 2, 3] } }, 'a NOT IN (1, 2, 3)'],
		[{ a: { $in: [] } }, 'a IN ()'],
		[{ a: { $in: [1, null] } }, '(a IN (1) OR a IS NULL)'],
		[{ a: { $nin: [null, 2] } }, '(a NOT IN (2) AND a IS NOT NULL)'],
		[{ a: { $in: [null] } }, 'a IS NULL'],
		// patterns and arrays
		[{ a: { $like: '%x%' } }, 'a LIKE "%x%"'],
		[{ a: { $nlike: 'x%' } }, 'a NOT LIKE "x%"'],
		[{ name: { $regex: '^test' } }, 'name ~ "^test"'],
		[{ name: /^test/ }, 'name ~ "^test"'],
		[{ tags: { $size: 3 } }, 'LENGTH(tags) = 3'],
		[{ tags: { $all: ['a', 'b'] } }, 'tags @> ["a", "b"]'],
		[{ tags: { $not: { $size: 1 } } }, '(NOT LENGTH(tags) = 1)'],
		[{ tags: { $or: [{ $all: ['a'] }] } }, 'tags @> ["a"]'],
		// logic
		[{ $not: { a: 1 } }, '(NOT a = 1)'],
		[{ a: { $not: { $gt: 5 } } }, '(NOT a > 5)'],
		[{ $and: { k: { a: 1 } } }, 'a = 1'],
		[{ $and: [{ a: 1 }, { b: 2 }] }, '(a = 1 AND b = 2)'],
		[{ $or: [{ a: 1 }, { b: 2 }] }, '(a = 1 OR b = 2)'],
		[{ $or: [{ a: 1, b: 2 }, { c: 3 }] }, '((a = 1 AND b = 2) OR c = 3)'],
		[{ $nor: [{ a: 1 }, { b: 2 }] }, '(NOT (a = 1 OR b = 2))'],
		// an empty branch matches everything
		[{ $or: [{}, { a: 1 }] }, ''],
		[{ $nor: [{}, { a: 1 }] }, 'FALSE'],
		[{ $or: [] }, ''],
		[{ $not: { $or: [{}, { a: 1 }] } }, 'FALSE'],
		[{ a: { $or: [{ $not: 1 }, { $gt: 5 }] } }, '((NOT a = 1) OR a > 5)'],
		[{ a: { $not: { $or: [{}, { $gt: 5 }] } } }, 'FALSE'],
		// nested objects and dot notation
		[{ profile: { age: 18 } }, 'profile.age = 18'],
		[{ 'profile.age': 18 }, 'profile.age = 18'],
		[{ profile: { 'address.city': 'New York' } }, 'profile.address.city = "New York"'],
		[{ profile: { $or: [{ age: 1 }, { age: 2 }] } }, '(profile.age = 1 OR profile.age = 2)'],
		[{ a: { $or: [{ $gt: 1 }, { $lt: 0 }] } }, '(a > 1 OR a < 0)'],
		// ignored and disabled
		[{ [DisableKey]: true, b: 2 }, ''],
		[{ a: { $eq: 1, [DisableKey]: true }, b: 2 }, 'b = 2'],
		[{ $and: { g1: { a: 1 }, g2: { [DisableKey]: true, b: 2 } } }, 'a = 1'],
		[{ $or: [{ a: { [DisableKey]: true } }, { b: 2 }] }, 'b = 2'],
		[{ $nor: [{ a: { [DisableKey]: true } }, { b: 2 }] }, '(NOT b = 2)'],
		[{ $or: [{ $and: [{ [DisableKey]: true }] }, { b: 2 }] }, 'b = 2'],
		[{ a: { $not: { b: { [DisableKey]: true } } } }, ''],
		[{ $nor: [{ a: { $comment: 'note' }, b: { [DisableKey]: true } }, { c: 1 }] }, 'FALSE'],
		[{ $nor: [{ a: { $eq: undefined }, b: { [DisableKey]: true } }, { c: 1 }] }, 'FALSE'],
		[{ $nor: [{ a: {} }] }, 'FALSE'],
		[{ $nor: [{ a: {}, b: { [DisableKey]: true } }] }, 'FALSE'],
		[{ $$note: 'x', a: undefined, b: 1 }, 'b = 1'],
		[{ $comment: 'saved filter', a: 1 }, 'a = 1'],
		[{ a: { $comment: 'field metadata', $eq: 1 } }, 'a = 1'],
		[{ profile: { $comment: 'nested metadata', age: 18 } }, 'profile.age = 18'],
		[{ [CommentKey]: { traceId: 'x' }, a: 1 }, 'a = 1'],
		// metadata on a record of groups (accepted at runtime, not typed)
		[{ $or: { $$note: 'x', g: { a: 1 } } } as unknown as AnyDocumentQuery, 'a = 1'],
		[{ $or: { [DisableKey]: true, g: { a: 1 } } } as unknown as AnyDocumentQuery, ''],
		[{ $or: { g: { [DisableKey]: true, a: 1 }, h: { b: 2 } } }, 'b = 2'],
		[{ a: { $not: { [DisableKey]: true, $eq: 1 } } }, ''],
		[{ $text: { $$disable: true, $search: 'ignored' } } as unknown as AnyDocumentQuery, ''],
		// names that start like a literal
		[{ trueValue: 1, nullish: null }, 'nullish IS NULL AND trueValue = 1'],
	])('%o → %s', (query, expected) => {
		const text = format(query);
		expect(text).toBe(expected);
		// every condition is valid MiniQuery that formats back to itself
		for (const condition of formatDocumentQuery(query)) expect(formatQuery(parseQuery(condition))).toBe(condition);
	});

	test('types', () => {
		const ok: DocumentQuery<User>[] = [
			{ $$disable: true, status: 'active' },
			{ $$note: 'saved filter', name: { $like: 'a%' } },
			{ $comment: 'saved filter', name: { $like: 'a%' } },
			{ $or: { adults: { 'profile.age': { $gte: 18 } }, off: { $$disable: true, status: 'inactive' } } },
		];
		const scalarOk: Array<DocumentQuery<{ a: number }>> = [{ a: [1, 2] }, { a: { $gt: 1, $$disable: true } }];
		interface Edge {
			a: number;
			name: string;
			p?: { city: string };
			posts: Array<{ title: string }>;
			tags?: string[];
			date: Date;
			choice: 'x' | 'y';
			variant: string | { x: number };
			union: { x: number } | { y: string };
			numbers: Array<number | null>;
			mixed: string | Array<{ x: number }>;
			nil: null;
		}
		const edgeOk: Array<DocumentQuery<Edge>> = [
			{ 'p.city': 'x' },
			{ name: /x/ },
			{ tags: null },
			{ tags: 'x' },
			{ p: { $exists: true } },
			{ p: { $eq: null } },
			{ date: null },
			{ choice: ['x', 'y'] },
			{ variant: ['x'] },
			{ 'union.x': 1 },
			{ nil: { $exists: true } },
			{ nil: { $eq: null } },
			{ tags: { $not: { $size: 1 } } },
			{ tags: { $or: [{ $all: ['x'] }] } },
			{ $not: { $or: [{ a: 2 }] } },
			{ a: { $or: [{ $not: 1 }] } },
			{ $text: { $search: 'x', $$disable: true } },
		];
		const nullablePostsOk: Array<DocumentQuery<{ posts: Array<{ title: string } | null> }>> = [
			{ 'posts.title': 'news' },
			{ posts: { title: 'news' } },
		];
		// @ts-expect-error nullable array object paths retain the nested value type
		const nullablePostsWrong: DocumentQuery<{ posts: Array<{ title: string } | null> }> = { 'posts.title': 1 };
		// @ts-expect-error a group must be a query
		const group: DocumentQuery<User> = { $or: { group: 'oops' } };
		// @ts-expect-error $elemMatch is not supported
		const elem: DocumentQuery<User> = { tags: { $elemMatch: 'x' } };
		// @ts-expect-error unsupported query operators are not accepted
		const where: DocumentQuery<{ a: number }> = { $where: 1 };
		// @ts-expect-error an array field does not accept an array as a scalar $eq value
		const arrayEq: DocumentQuery<Edge> = { tags: { $eq: ['x'] } };
		// @ts-expect-error nested object arrays are not MiniQuery literals
		const objectArray: DocumentQuery<Edge> = { posts: [{ title: 'x' }] };
		// @ts-expect-error object values are not MiniQuery literals in $in
		const objectIn: DocumentQuery<Edge> = { posts: { $in: [{ title: 'x' }] } };
		// @ts-expect-error object equality is not a MiniQuery literal
		const objectEq: DocumentQuery<Edge> = { p: { $eq: { city: 'x' } } };
		// @ts-expect-error object arrays are not MiniQuery literals in a union field
		const mixedObjectArray: DocumentQuery<Edge> = { mixed: [{ x: 1 }] };
		// @ts-expect-error ordering comparisons do not accept null
		const nullableGreater: DocumentQuery<Edge> = { numbers: { $gt: null } };
		// @ts-expect-error a null-only field cannot use ordering comparisons
		const nullGreater: DocumentQuery<Edge> = { nil: { $gt: null } };
		// @ts-expect-error nested arrays are not MiniQuery literals
		const matrixArray: DocumentQuery<{ matrix: number[][] }> = { matrix: [[1]] };
		// @ts-expect-error text search is only supported at the query level
		const nestedText: DocumentQuery<Edge> = { p: { $text: { $search: 'x' } } };
		// @ts-expect-error array indexes are not valid MiniQuery field names
		const arrayIndex: DocumentQuery<Edge> = { 'tags.0': 'x' };
		// @ts-expect-error the optional nested field remains a string
		const wrongCity: DocumentQuery<Edge> = { 'p.city': 3 };
		// @ts-expect-error the union path keeps its numeric leaf type
		const wrongUnion: DocumentQuery<Edge> = { 'union.x': 'bad' };
		expect([
			...ok,
			...scalarOk,
			...edgeOk,
			group,
			elem,
			where,
			arrayEq,
			objectArray,
			objectIn,
			objectEq,
			mixedObjectArray,
			nullableGreater,
			nullGreater,
			matrixArray,
			nestedText,
			arrayIndex,
			wrongCity,
			wrongUnion,
			nullablePostsOk,
			nullablePostsWrong,
		]).toHaveLength(40);
	});

	test('typed queries', () => {
		const queries: Array<[DocumentQuery<User>, string]> = [
			[{ status: 'active', 'profile.age': { $gte: 18 } }, 'profile.age >= 18 AND status = "active"'],
			[{ profile: { age: { $gte: 18 } } }, 'profile.age >= 18'],
			[
				{ $or: [{ name: 'John' }, { name: 'Jane' }], status: 'inactive' },
				'(name = "John" OR name = "Jane") AND status = "inactive"',
			],
			[{ created: { $gt: new Date('2024-01-01T00:00:00Z') } }, 'created > "2024-01-01T00:00:00.000Z"'],
			[{ tags: { $all: ['a'] } }, 'tags @> ["a"]'],
		];
		for (const [query, expected] of queries) expect(format(query)).toBe(expected);
	});

	test.each<[AnyDocumentQuery, string]>([
		[{ a: `it's "x"` }, 'both quote characters'],
		[{ a: Number.NaN }, 'Number can not be written'],
		[{ a: 2n ** 64n }, 'Number can not be written'],
		[{ _id: 1 }, 'Field can not be written in MiniQuery: _id'],
		[{ end: 1 }, 'Field can not be written in MiniQuery: end'],
		[{ 'tags.0': 'x' }, 'Field can not be written in MiniQuery: tags.0'],
		[{ a: { $in: 1 } }, '$in requires an array'],
		[{ a: { $eq: { x: 1 } } }, '$eq requires a value'],
		[{ a: { $gt: null } }, '$gt requires a value'],
		[{ a: { $like: 1 } }, '$like requires a string'],
		[{ a: { $regex: 'x', $options: 'i' } }, '$options are not supported'],
		[{ a: /x/i }, 'flags are not supported'],
		[{ a: { $size: -1 } }, '$size requires a non-negative integer'],
		[{ a: { $elemMatch: { b: 1 } } }, 'Unsupported operator $elemMatch'],
		[{ $where: 'x' }, 'Unsupported operator $where'],
		[{ $commentary: 'x' }, 'Unsupported operator $commentary'],
		[{ profile: { $text: { $search: 'x' } } } as unknown as AnyDocumentQuery, 'Unsupported operator $text at profile'],
		[{ $text: { $search: 'x' } }, '$text requires the onSearch option'],
		[{ $or: 1 } as unknown as AnyDocumentQuery, '$or requires a list or a record'],
		[{ $or: { g: 'x' } } as unknown as AnyDocumentQuery, 'Invalid query at root: expected an object'],
		[{ a: new Map() }, 'Unsupported value'],
	])('rejects %o', (query, message) => {
		expect(() => formatDocumentQuery(query)).toThrow(message);
	});

	test('rejects sparse arrays', () => {
		const sparse = new Array(2);
		expect(() => formatDocumentQuery({ a: { $in: sparse } } as unknown as AnyDocumentQuery)).toThrow('sparse arrays');
		expect(() => formatDocumentQuery({ a: { $nin: sparse } } as unknown as AnyDocumentQuery)).toThrow('sparse arrays');
		expect(() => formatDocumentQuery({ a: { $all: sparse } } as unknown as AnyDocumentQuery)).toThrow('sparse arrays');
	});

	test('does not inspect disabled nested objects', () => {
		const disabled = {
			$$disable: true,
			get age(): never {
				throw new Error('disabled value was read');
			},
		};
		expect(formatDocumentQuery({ a: 1, profile: disabled } as unknown as AnyDocumentQuery)).toEqual(['a = 1']);
	});

	test('reads nested values once and ignores comment getters', () => {
		let reads = 0;
		const profile = {
			get age() {
				reads++;
				return reads === 1 ? 18 : undefined;
			},
		};
		const metadata = {
			get $comment(): never {
				throw new Error('comment metadata was read');
			},
			age: 19,
		};
		expect(formatDocumentQuery({ profile, nested: metadata } as unknown as AnyDocumentQuery)).toEqual([
			'nested.age = 19',
			'profile.age = 18',
		]);
		expect(reads).toBe(1);
		let disabledReads = 0;
		const changingDisabled = {
			get $$disable() {
				return disabledReads++ > 0;
			},
			age: 20,
		};
		expect(formatDocumentQuery({ profile: changingDisabled } as unknown as AnyDocumentQuery)).toEqual([
			'profile.age = 20',
		]);
		expect(disabledReads).toBe(1);
	});

	test('reads text search once', () => {
		let reads = 0;
		let received: string | undefined;
		const text = {
			get $search() {
				reads++;
				return reads === 1 ? 'first' : 'second';
			},
		};
		documentQueryToExpr({ $text: text } as unknown as AnyDocumentQuery, {
			onSearch: (search) => {
				received = search;
				return { type: 'literal', value: search };
			},
		});
		expect(reads).toBe(1);
		expect(received).toBe('first');
	});

	test('reuses disabled state for operator operands', () => {
		let reads = 0;
		const operand = {
			$gte: 18,
			get $$disable() {
				return ++reads > 1;
			},
		};
		expect(formatDocumentQuery({ age: operand } as unknown as AnyDocumentQuery)).toEqual(['age >= 18']);
		expect(reads).toBe(1);

		reads = 0;
		const notOperand = {
			$eq: 18,
			get $$disable() {
				return ++reads > 1;
			},
		};
		expect(formatDocumentQuery({ $not: { age: notOperand } } as unknown as AnyDocumentQuery)).toEqual([
			'(NOT age = 18)',
		]);
		expect(reads).toBe(1);
		reads = 0;
		expect(formatDocumentQuery({ age: { $not: notOperand } } as unknown as AnyDocumentQuery)).toEqual([
			'(NOT age = 18)',
		]);
		expect(reads).toBe(1);
	});

	test('shares disabled cache within one conversion only', () => {
		let reads = 0;
		const sharedText = {
			$search: 'shared',
			get $$disable() {
				return ++reads > 1;
			},
		};
		const query = { $or: [{ $text: sharedText }, { $text: sharedText }] } as unknown as AnyDocumentQuery;
		const options = { onSearch: (): Expr => ({ type: 'literal', value: 'match' }) };
		expect(formatDocumentQuery(query, options)).toEqual(['("match" OR "match")']);
		expect(reads).toBe(1);
		expect(formatDocumentQuery(query, options)).toEqual([]);
		expect(reads).toBe(2);
	});

	test('shares text entries within one conversion only', () => {
		let reads = 0;
		const sharedText = {
			get $search() {
				return `q${++reads}`;
			},
		};
		const query = { $or: [{ $text: sharedText }, { $text: sharedText }] } as unknown as AnyDocumentQuery;
		const options = { onSearch: (search: string): Expr => ({ type: 'literal', value: search }) };
		expect(formatDocumentQuery(query, options)).toEqual(['("q1" OR "q1")']);
		expect(reads).toBe(1);
		expect(formatDocumentQuery(query, options)).toEqual(['("q2" OR "q2")']);
		expect(reads).toBe(2);
	});

	test('$text is handled by onSearch', () => {
		const onSearch = (search: string): Expr => ({
			type: 'func',
			name: 'search',
			args: [{ type: 'literal', value: search }],
		});
		expect(formatDocumentQuery({ $text: { $search: 'hello' }, a: 1 }, { onSearch })).toEqual([
			'search("hello")',
			'a = 1',
		]);
		expect(formatDocumentQuery({ $text: { $search: 'x' } }, { onSearch: () => undefined })).toEqual([]);
		expect(
			formatDocumentQuery({ $or: [{ $text: { $search: 'x' } }, { a: 1 }] } as unknown as AnyDocumentQuery, {
				onSearch: () => undefined,
			}),
		).toEqual(['a = 1']);
		expect(
			formatDocumentQuery({ $nor: [{ $text: { $search: 'x' } }, { a: 1 }] } as unknown as AnyDocumentQuery, {
				onSearch: () => undefined,
			}),
		).toEqual(['(NOT a = 1)']);
		expect(
			formatDocumentQuery(
				{ $or: [{ $text: { $$disable: true, $search: 'x' } }, { a: 1 }] } as unknown as AnyDocumentQuery,
				{ onSearch: () => ({ type: 'literal', value: 'unused' }) },
			),
		).toEqual(['a = 1']);
		expect(
			formatDocumentQuery(
				{ $nor: [{ $text: { $$disable: true, $search: 'x' } }, { a: 1 }] } as unknown as AnyDocumentQuery,
				{ onSearch: () => ({ type: 'literal', value: 'unused' }) },
			),
		).toEqual(['(NOT a = 1)']);
		expect(
			formatDocumentQuery(
				{
					$nor: [{ $and: [{}, { $text: { $search: 'x' } }] }, { a: 1 }],
				} as unknown as AnyDocumentQuery,
				{ onSearch: () => undefined },
			),
		).toEqual(['FALSE']);
		expect(() =>
			formatDocumentQuery({ $text: { $search: 'x', $caseSensitive: true } } as unknown as AnyDocumentQuery, {
				onSearch,
			}),
		).toThrow('Unsupported $text option $caseSensitive');
		expect(() =>
			documentQueryToExpr({ $or: [{ $text: { $search: 'x' } }, { a: 1 }] } as unknown as AnyDocumentQuery, {
				onSearch: () => ({ type: 'logic', op: 'AND', exprs: [] }),
			}),
		).toThrow('at least two expressions');
		expect(() =>
			documentQueryToExpr({ $text: { $search: 'x' } }, { onSearch: () => false as unknown as Expr }),
		).toThrow('Unknown type');
		let called = false;
		expect(
			formatDocumentQuery({ $text: { $$disable: true, $search: 'ignored' } } as unknown as AnyDocumentQuery, {
				onSearch: () => {
					called = true;
					return undefined;
				},
			}),
		).toEqual([]);
		expect(called).toBe(false);
		called = false;
		expect(() =>
			formatDocumentQuery({ profile: { $or: [{ $text: { $search: 'ignored' } }] } } as unknown as AnyDocumentQuery, {
				onSearch: () => {
					called = true;
					return undefined;
				},
			}),
		).toThrow('Unsupported operator $text at profile');
		expect(called).toBe(false);
	});
});

describe('documentQueryToExpr', () => {
	test('builds a MiniQuery expression', () => {
		expect(documentQueryToExpr({})).toBeUndefined();
		expect(() => documentQueryToExpr({ a: `it's "x` })).toThrow('both quote characters');
		expect(documentQueryToExpr({ a: 1, b: { $gt: 2 } })).toEqual({
			type: 'logic',
			op: 'AND',
			exprs: [
				{ type: 'compare', op: '=', left: { type: 'ref', value: ['a'] }, right: { type: 'literal', value: 1 } },
				{ type: 'compare', op: '>', left: { type: 'ref', value: ['b'] }, right: { type: 'literal', value: 2 } },
			],
		});
	});

	test('does not reuse constant FALSE nodes', () => {
		const first = documentQueryToExpr({ $nor: [{}] }) as any;
		first.value = true;
		expect(formatDocumentQuery({ $nor: [{}] })).toEqual(['FALSE']);
	});

	// Random queries over fields a, b, c.d evaluated on documents where every field is present (possibly null):
	// MiniQuery `resolveQuery` on the converted expression must agree with the query's own meaning.
	test('keeps the meaning of random queries', () => {
		let seed = 11;
		const rand = (n: number) => {
			seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
			return (seed >>> 8) % n;
		};
		const pick = <T>(items: T[]) => items[rand(items.length)];
		const fields = ['a', 'b', 'c.d'];
		const values = [0, 1, 2, 'x', 'y', null];
		const get = (doc: any, field: string) => field.split('.').reduce((v, k) => v?.[k], doc);

		type Cond = (doc: any) => boolean;
		// a field condition as an operator object: a value is $eq, an array (IN) is $in
		const asOperator = (q: any) =>
			Array.isArray(q) ? { $in: q } : q !== null && typeof q === 'object' ? q : { $eq: q };
		const fieldOp = (field: string): [any, Cond] => {
			const v = pick(values);
			const list = [pick(values), pick(values)];
			const at = (doc: any) => get(doc, field);
			switch (rand(9)) {
				case 0:
					return [v, (d) => at(d) === v];
				case 1:
					return [{ $ne: v }, (d) => at(d) !== v];
				case 2:
					return v === null ? [{ $eq: v }, (d) => at(d) === null] : [{ $gt: v }, (d) => at(d) > (v as any)];
				case 3:
					return v === null ? [{ $exists: true }, (d) => at(d) !== null] : [{ $lte: v }, (d) => at(d) <= (v as any)];
				case 4:
					return [{ $in: list }, (d) => list.includes(at(d))];
				case 5:
					return [{ $nin: list }, (d) => !list.includes(at(d))];
				case 6:
					return [list, (d) => list.includes(at(d))];
				case 7: {
					const [inner, test] = fieldOp(field);
					return [{ $not: asOperator(inner) }, (d) => !test(d)];
				}
				default: {
					const [x, tx] = fieldOp(field);
					const [y, ty] = fieldOp(field);
					return [{ $or: [asOperator(x), asOperator(y)] }, (d) => tx(d) || ty(d)];
				}
			}
		};
		const query = (depth: number): [AnyDocumentQuery, Cond] => {
			if (depth > 2 || rand(3) === 0) {
				const field = pick(fields);
				const [q, test] = fieldOp(field);
				return [{ [field]: q }, test];
			}
			const parts = Array.from({ length: 1 + rand(3) }, () => query(depth + 1));
			const op = pick(['$and', '$or', '$nor', '$not', 'merge'] as const);
			if (op === '$not') return [{ $not: parts[0][0] }, (d) => !parts[0][1](d)];
			if (op === 'merge') {
				// the parts' fields in one object (AND); operators or colliding keys fall back to $and
				const merged: Record<string, any> = {};
				for (const [q] of parts) {
					for (const k of Object.keys(q)) {
						if (k.startsWith('$') || k in merged) {
							return [{ $and: parts.map((p) => p[0]) }, (d) => parts.every((p) => p[1](d))];
						}
						merged[k] = q[k];
					}
				}
				return [merged, (d) => parts.every((p) => p[1](d))];
			}
			const list = parts.map((p) => p[0]);
			// sometimes a record of named groups, with metadata and a disabled group that must be ignored
			// record-level metadata is untyped (see QueryGroups), so this value is any
			const qs: any = rand(3)
				? list
				: {
						...Object.fromEntries(list.map((q, i) => [`g${i}`, q])),
						$$note: 'ignored',
						off: { [DisableKey]: true, a: 'never' },
					};
			if (op === '$and') return [{ $and: qs }, (d) => parts.every((p) => p[1](d))];
			if (op === '$or') return [{ $or: qs }, (d) => parts.some((p) => p[1](d))];
			return [{ $nor: qs }, (d) => !parts.some((p) => p[1](d))];
		};

		const docs = Array.from({ length: 40 }, () => ({ a: pick(values), b: pick(values), c: { d: pick(values) } }));
		for (let i = 0; i < 1500; i++) {
			const [q, test] = query(0);
			const expr = documentQueryToExpr(q);
			const text = expr ? formatQuery(expr) : '';
			// the expression and each condition string are valid MiniQuery that formats back to itself
			if (text) expect(formatQuery(parseQuery(text)), JSON.stringify(q)).toBe(text);
			for (const c of formatDocumentQuery(q)) expect(formatQuery(parseQuery(c)), JSON.stringify(q)).toBe(c);
			for (const doc of docs) {
				const actual = expr ? Boolean(resolveQuery(expr, { context: doc })) : true;
				expect(actual, `${JSON.stringify(q)} on ${JSON.stringify(doc)}: ${text}`).toBe(test(doc));
			}
		}
	}, 30_000);
});
