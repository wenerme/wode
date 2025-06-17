import { inspect } from 'node:util';
import { expect, test } from 'vitest';
import { DocumentQueryDisableKey, formatDocumentQuery } from './formatDocumentQuery';

test('formatDocumentQuery', () => {
	for (const [a, b] of [
		[null, []],
		[[], []],
		[undefined, []],
		[{}, []],
		[{ $and: [{ $and: [] }, { $or: [] }], $or: [{}] }, []],
		[{ status: 1 }, ['status = 1']],
		[{ status: { $eq: 1 } }, ['status = 1']],
		[{ a: { $eq: 1 }, b: { $eq: 1, [DocumentQueryDisableKey]: true } }, ['a = 1']],
		[{ a: [1, 2, 3] }, ['a IN [1,2,3]']],
		[{ a: { $nin: [1, 2, 3] } }, ['a NOT IN [1,2,3]']],
		[{ $not: { a: 1 } }, ['NOT a = 1']],
		[{ $not: { a: 1, b: 1 } }, ['NOT (a = 1 AND b = 1)']],
		[{ $and: [{ a: 1 }] }, ['a = 1']],
		[{ $and: [{ $and: [{ a: 1 }] }] }, ['a = 1']],
		[{ $or: [{ a: 1 }] }, ['a = 1']],
		[{ $and: [{ a: 1 }], b: 2 }, ['a = 1', 'b = 2']],
		[{ $and: { _a: { a: 1 }, _b: { $or: [{ b: 2 }] } } }, ['(a = 1 AND b = 2)']],
		[{ [DocumentQueryDisableKey]: true, b: 2 }, []],
		[{ $and: { [Symbol.for('k')]: { a: 1 } } }, []], //
		[{ a: { b: { c: { id: ['1'] } } } }, ['a.b.c.id IN ["1"]']],
	]) {
		const result = formatDocumentQuery(a);
		console.log(inspect(a, { depth: 5, colors: true, compact: true }), `\n>`, result);
		expect(result).toEqual(b);
	}
});
