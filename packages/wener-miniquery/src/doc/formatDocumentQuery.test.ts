import { inspect } from 'node:util';
import { describe, expect, test } from 'vite-plus/test';
import { DisableKey, formatDocumentQuery } from './formatDocumentQuery';
import type { DocumentQuery } from './types';

// Define a sample interface for type-safe tests
interface User {
	id: number;
	name: string;
	status: 'active' | 'inactive';
	tags: string[];
	posts: Array<{ title: string; published: boolean }>;
	profile: {
		age: number;
		email?: string;
		address?: {
			city: string;
			street: string;
		};
	};
}

describe('formatDocumentQuery', () => {
	test('should format various cases', () => {
		const testCases: Array<[any, string | undefined]> = [
			// Basic cases
			[null, ''],
			[undefined, ''],
			[{}, ''],
			// Equality and comparison
			[{ status: 1 }, 'status = 1'],
			[{ status: { $eq: 1 } }, 'status = 1'],
			[{ a: { $ne: 'test' } }, 'a != "test"'],
			[{ a: { $gt: 10 } }, 'a > 10'],
			// IN and NOT IN
			[{ a: [1, 2, 3] }, 'a IN (1, 2, 3)'],
			[{ a: { $in: [1, 2, 3] } }, 'a IN (1, 2, 3)'],
			[{ a: { $nin: [1, 2, 3] } }, 'a NOT IN (1, 2, 3)'],
			// Logical operators
			[{ $not: { a: 1 } }, 'NOT (a = 1)'],
			[{ $and: { k: { a: 1 } } }, 'a = 1'],
			[{ $and: [{ a: 1 }, { b: 2 }] }, '(a = 1 AND b = 2)'],
			[{ $or: [{ a: 1 }, { b: 2 }] }, '(a = 1 OR b = 2)'],
			[{ $nor: [{ a: 1 }, { b: 2 }] }, 'NOT ((a = 1 OR b = 2))'],
			// Nested objects and dot notation
			[{ profile: { age: 18 } }, 'profile.age = 18'],
			[{ 'profile.age': 18 }, 'profile.age = 18'],
			// Test for nested dot notation bug fix
			[{ profile: { 'address.city': 'New York' } }, 'profile.address.city = "New York"'],
			// Special values
			[{ a: null }, 'a IS NULL'],
			// Disable key
			[{ [DisableKey]: true, b: 2 }, ''],
			[{ a: { $eq: 1, [DisableKey]: true }, b: 2 }, 'b = 2'],
			// --- New Operator Tests ---
			// $exists
			[{ name: { $exists: true } }, 'name IS NOT NULL'],
			[{ name: { $exists: false } }, 'name IS NULL'],
			// $regex
			[{ name: { $regex: '^test' } }, `name RLIKE "^test"`],
			// $size
			[{ tags: { $size: 3 } }, 'LENGTH(tags) = 3'],
			// $all
			// [{ tags: { $all: ['a', 'b'] } }, 'CONTAINS(tags, "a") AND CONTAINS(tags, "b")'],
			// $elemMatch
			// [
			// 	{ posts: { $elemMatch: { published: true, title: { $like: '%SQL%' } } } },
			// 	`ELEM_MATCH(posts, 'published = true AND title LIKE "%SQL%"')`,
			// ],
		];

		for (const [query, expected] of testCases) {
			const result = formatDocumentQuery(query);
			console.log(inspect(query, { depth: 5, colors: true, compact: true }), `\n>`, result);
			expect(result.join(' AND ')).toEqual(expected);
		}
	});

	test('should handle type safety', () => {
		const testCases: Array<[DocumentQuery<User>, string | undefined]> = [
			[
				{
					status: 'active',
					'profile.age': { $gte: 18 },
				},
				'profile.age >= 18 AND status = "active"',
			],
			[
				{
					profile: { age: { $gte: 18 } },
				},
				'profile.age >= 18',
			],
			[
				{
					$or: [{ name: 'John' }, { name: 'Jane' }],
					status: 'inactive',
				},
				'(name = "John" OR name = "Jane") AND status = "inactive"',
			],
		];

		for (const [query, expected] of testCases) {
			const result = formatDocumentQuery(query);
			console.log(inspect(query, { depth: 5, colors: true, compact: true }), `\n>`, result);
			expect(result.join(' AND ')).toEqual(expected);
		}
	});
});
