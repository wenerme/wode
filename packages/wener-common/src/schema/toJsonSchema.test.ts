import { inspect } from 'node:util';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { toJsonSchema } from './toJsonSchema';

describe('toJsonSchema', () => {
	it('should handle discriminatedUnion', () => {
		console.log(
			inspect(
				toJsonSchema(
					z.discriminatedUnion([
						z.object({
							type: z.literal('string'),
							value: z.string(),
						}),
						z.object({
							type: z.literal('number'),
							value: z.number(),
						}),
					]),
				),
				{
					depth: 10,
					colors: true,
				},
			),
		);
	});

	it('should cache', () => {
		let zs = z.object({
			name: z.string(),
		});

		expect(toJsonSchema(zs)).toBe(toJsonSchema(zs));
	});
});
