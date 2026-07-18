import { describe, expect, it } from 'vite-plus/test';
import type { QueryJsonSchema } from './query-json-schema';
import { queryFieldsFromJsonSchema } from './query-json-schema';

const schema: QueryJsonSchema = {
	type: 'object',
	title: 'Customer',
	required: ['status'],
	$defs: {
		OwnerId: { type: 'string', title: 'Owner', description: 'Assigned account owner' },
	},
	properties: {
		status: {
			type: 'string',
			title: 'Status',
			enum: ['active', 'paused'],
			'x-enumNames': ['Active', 'Paused'],
			'x-query': { order: 1, operators: ['eq', 'ne', 'in'] },
		},
		amount: { type: 'number', title: 'Revenue', 'x-query': { order: 2 } },
		createdAt: { type: ['string', 'null'], format: 'date-time', title: 'Created at' },
		ownerId: { $ref: '#/$defs/OwnerId', 'x-query': { editor: 'owner', group: 'Relations' } },
		tags: {
			type: 'array',
			items: { type: 'string', enum: ['priority', 'renewal'] },
		},
		profile: {
			type: 'object',
			title: 'Profile',
			properties: {
				city: { type: 'string', title: 'City' },
				'a/b': { type: 'boolean', title: 'Special flag' },
			},
		},
		hidden: { type: 'string', 'x-query': { hidden: true } },
	},
};

describe('queryFieldsFromJsonSchema', () => {
	it('flattens nested objects into stable JSON Pointer fields', () => {
		const result = queryFieldsFromJsonSchema(schema);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields.map((field) => field.name)).toEqual([
			'/status',
			'/amount',
			'/createdAt',
			'/ownerId',
			'/tags',
			'/profile/city',
			'/profile/a~1b',
		]);
		expect(result.fields.find((field) => field.name === '/status')).toMatchObject({
			kind: 'enum',
			required: true,
			operators: ['eq', 'ne', 'in'],
			options: [
				{ value: 'active', label: 'Active' },
				{ value: 'paused', label: 'Paused' },
			],
		});
		expect(result.fields.find((field) => field.name === '/createdAt')?.kind).toBe('datetime');
		expect(result.fields.find((field) => field.name === '/ownerId')).toMatchObject({
			label: 'Owner',
			editor: 'owner',
			group: 'Relations',
		});
		expect(result.fields.find((field) => field.name === '/tags')).toMatchObject({
			kind: 'array',
			itemKind: 'enum',
			options: [
				{ value: 'priority', label: 'priority' },
				{ value: 'renewal', label: 'renewal' },
			],
		});
		expect(result.fields.find((field) => field.name === '/profile/city')?.group).toBe('Profile');
	});

	it('preserves prototype-sensitive property names through ref normalization', () => {
		const target = JSON.parse(
			'{"type":"object","properties":{"__proto__":{"type":"string"},"constructor":{"type":"number"}}}',
		) as QueryJsonSchema;
		const result = queryFieldsFromJsonSchema({
			type: 'object',
			$defs: { Target: target },
			properties: { entity: { $ref: '#/$defs/Target' } },
		});
		expect(result.fields.map((field) => field.name)).toEqual(['/entity/__proto__', '/entity/constructor']);
		expect(result.diagnostics).toEqual([]);
		const inheritedOverride = queryFieldsFromJsonSchema(
			{
				type: 'object',
				properties: { alias: { type: 'string', 'x-query': { field: 'constructor' } } },
			},
			{ fieldOverrides: {} },
		);
		expect(inheritedOverride.fields[0]?.name).toBe('constructor');
	});

	it('supports oneOf constants, field overrides, include, and map hooks', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			properties: {
				priority: {
					type: 'string',
					oneOf: [
						{ const: 'high', title: 'High' },
						{ const: 'low', title: 'Low' },
					],
				},
				internal: { type: 'string' },
			},
		};
		const result = queryFieldsFromJsonSchema(source, {
			fieldOverrides: { '/priority': { label: 'Urgency' } },
			include: ({ path }) => path !== '/internal',
			mapField: ({ field }) => ({ ...field, placeholder: 'Choose one' }),
		});
		expect(result.fields).toHaveLength(1);
		expect(result.fields[0]).toMatchObject({
			name: '/priority',
			label: 'Urgency',
			kind: 'enum',
			placeholder: 'Choose one',
		});
	});

	it('reports remote, unresolved, cyclic, depth, and extension diagnostics without silent fields', () => {
		const invalid: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Cycle: { $ref: '#/$defs/Cycle' },
			},
			properties: {
				remote: { $ref: 'https://example.com/schema.json' },
				missing: { $ref: '#/$defs/Missing' },
				cycle: { $ref: '#/$defs/Cycle' },
				unknownExtension: {
					type: 'string',
					'x-query': { unsupported: true },
				},
				deep: {
					type: 'object',
					properties: { nested: { type: 'object', properties: { value: { type: 'string' } } } },
				},
			},
		};
		const result = queryFieldsFromJsonSchema(invalid, { maxDepth: 1 });
		const codes = result.diagnostics.map((item) => item.code);
		expect(codes).toContain('remote-ref');
		expect(codes).toContain('unresolved-ref');
		expect(codes).toContain('cyclic-ref');
		expect(codes).toContain('unknown-extension');
		expect(codes).toContain('max-depth');
		expect(result.fields.map((field) => field.name)).toEqual(['/unknownExtension']);
	});

	it('rejects invalid x-query operators while keeping the field visible', () => {
		const source = {
			type: 'object',
			properties: {
				name: { type: 'string', 'x-query': { operators: 'eq' } },
			},
		} as unknown as QueryJsonSchema;
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toHaveLength(1);
		expect(result.fields[0].operators).toBeUndefined();
		expect(result.diagnostics.some((item) => item.code === 'invalid-extension')).toBe(true);
	});

	it('ignores invalid extension values and rejects duplicate field aliases', () => {
		const source = {
			type: 'object',
			properties: {
				first: { type: 'string', 'x-query': { field: 'shared', hidden: 'false', order: '1' } },
				second: { type: 'number', 'x-query': { field: 'shared', kind: ['string'] } },
			},
		} as unknown as QueryJsonSchema;
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toHaveLength(1);
		expect(result.fields[0]).toMatchObject({ name: 'shared', kind: 'string' });
		expect(result.diagnostics.filter((item) => item.code === 'invalid-extension')).toHaveLength(3);
		expect(result.diagnostics.some((item) => item.code === 'duplicate-field' && item.severity === 'error')).toBe(true);
	});

	it('resolves URI-encoded local JSON Pointers and combines reference siblings', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				'address shape': {
					type: 'object',
					required: ['city'],
					properties: { city: { type: 'string', title: 'City' } },
				},
			},
			properties: {
				template: {
					type: 'object',
					properties: { code: { type: 'string', title: 'Code' } },
				},
				fromProperty: {
					$ref: '#/properties/template',
					properties: { enabled: { type: 'boolean', title: 'Enabled' } },
				},
				address: {
					$ref: '#/$defs/address%20shape',
					properties: { postalCode: { type: 'string', title: 'Postal code' } },
					required: ['postalCode'],
				},
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields.map((field) => field.name)).toEqual([
			'/template/code',
			'/fromProperty/code',
			'/fromProperty/enabled',
			'/address/city',
			'/address/postalCode',
		]);
		expect(result.fields.find((field) => field.name === '/address/city')?.required).toBe(true);
		expect(result.fields.find((field) => field.name === '/address/postalCode')?.required).toBe(true);
	});

	it('diagnoses malformed runtime schema nodes without throwing', () => {
		const cyclicOneOf: Record<string, unknown> = {};
		cyclicOneOf.oneOf = [cyclicOneOf];
		const source = {
			type: 'object',
			properties: {
				valid: { type: 'string' },
				nullNode: null,
				badType: { type: 42 },
				badEnum: { type: 'string', enum: { active: true } },
				badRef: { $ref: { path: '#/$defs/x' } },
				badOneOf: { oneOf: [{ type: 42, const: { value: 'x' } }] },
				badExtension: { type: 'string', 'x-query': null },
				cyclicOneOf,
			},
		} as unknown as QueryJsonSchema;
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields.map((field) => field.name)).toEqual(['/valid', '/badExtension']);
		expect(result.diagnostics.filter((item) => item.code === 'invalid-schema').length).toBeGreaterThanOrEqual(6);
		expect(result.diagnostics.some((item) => item.code === 'invalid-extension' && item.path === '/badExtension')).toBe(
			true,
		);
	});

	it('rejects invalid pointer escapes and nested reference sibling type conflicts', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Shape: {
					type: 'object',
					properties: { value: { type: 'string' } },
				},
				'a~b': { type: 'string' },
			},
			properties: {
				goodEscape: { $ref: '#/$defs/a~0b' },
				badEscape: { $ref: '#/$defs/a~2b' },
				conflict: {
					$ref: '#/$defs/Shape',
					properties: { value: { type: 'number' } },
				},
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields.map((field) => field.name)).toEqual(['/goodEscape']);
		expect(result.diagnostics.some((item) => item.code === 'unresolved-ref' && item.ref === '#/$defs/a~2b')).toBe(true);
		expect(
			result.diagnostics.some((item) => item.code === 'invalid-schema' && item.path.endsWith('/properties/value')),
		).toBe(true);
	});

	it('intersects type and enum constraints from reference siblings', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Choice: { type: ['string', 'number'], enum: ['a', 'b'] },
			},
			properties: {
				choice: { $ref: '#/$defs/Choice', type: 'string', enum: ['b', 'c'] },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0]).toMatchObject({
			name: '/choice',
			kind: 'enum',
			options: [{ value: 'b', label: 'b' }],
		});
	});

	it('fails closed for unresolved array items, inherited pointers, and nested oneOf refs', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			properties: {
				array: { type: 'array', items: { $ref: '#/$defs/MissingItem' } },
				inherited: { $ref: '#/__proto__' },
				choice: {
					type: 'string',
					oneOf: [{ $ref: '#/$defs/MissingChoice' }],
				},
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toEqual([]);
		expect(result.diagnostics.filter((item) => item.code === 'unresolved-ref')).toHaveLength(3);
	});

	it('rejects oneOf, enum, const, and type sibling combinations it cannot safely intersect', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				EnumChoice: { enum: ['a'] },
				Constant: { const: 'a' },
			},
			properties: {
				oneOfConflict: {
					$ref: '#/$defs/EnumChoice',
					oneOf: [{ const: 'b' }],
				},
				constTypeConflict: { $ref: '#/$defs/Constant', type: 'number' },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toEqual([]);
		expect(result.diagnostics.filter((item) => item.code === 'invalid-schema')).toHaveLength(2);
	});

	it('intersects direct enum, const, and oneOf value constraints', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			properties: {
				value: {
					type: 'number',
					enum: [1, 2],
					const: 2,
					oneOf: [{ const: 2, title: 'Two' }],
				},
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 2, label: '2' }]);
	});

	it('supports array tokens in local JSON Pointers', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Variants: { oneOf: [{ type: 'string', title: 'Variant' }] },
			},
			properties: {
				variant: { $ref: '#/%24defs/Variants/oneOf/0' },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0]).toMatchObject({ name: '/variant', label: 'Variant', kind: 'string' });
	});

	it('rejects direct schema object cycles in properties and items', () => {
		const cyclicObject = { type: 'object', properties: {} } as unknown as QueryJsonSchema;
		(cyclicObject.properties as Record<string, QueryJsonSchema>).self = cyclicObject;
		const cyclicArray = { type: 'array' } as QueryJsonSchema;
		cyclicArray.items = cyclicArray;
		const source = {
			type: 'object',
			properties: { cyclicObject, cyclicArray },
		} as QueryJsonSchema;
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toEqual([]);
		expect(
			result.diagnostics.filter(
				(item) => item.code === 'invalid-schema' && item.message === 'Schema object cycles are not supported.',
			).length,
		).toBeGreaterThanOrEqual(2);
	});

	it('normalizes finite oneOf refs before intersecting sibling constraints', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Finite: {
					oneOf: [
						{ const: 'a', title: 'Alpha' },
						{ const: 'b', title: 'Beta' },
					],
				},
			},
			properties: {
				value: { $ref: '#/$defs/Finite', type: 'string', enum: ['b'] },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 'b', label: 'Beta' }]);
	});

	it('keeps enum labels aligned when sibling types filter values', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Mixed: { type: ['number', 'string'], enum: [1, 'a'], 'x-enumNames': ['One', 'Alpha'] },
			},
			properties: { value: { $ref: '#/$defs/Mixed', type: 'string' } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 'a', label: 'Alpha' }]);
	});

	it('recursively intersects array items from reference siblings', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Tags: {
					type: 'array',
					items: { type: 'string', enum: ['x', 'y'], 'x-enumNames': ['Ex', 'Why'] },
				},
			},
			properties: {
				tags: {
					$ref: '#/$defs/Tags',
					items: { type: 'string', enum: ['y', 'z'], 'x-enumNames': ['Sibling Why', 'Zed'] },
				},
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0]).toMatchObject({
			name: '/tags',
			kind: 'array',
			itemKind: 'enum',
			options: [{ value: 'y', label: 'Sibling Why' }],
		});
	});

	it('resolves both item refs before recursively intersecting them', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				AItem: { type: 'string', enum: ['a', 'b'], 'x-enumNames': ['A', 'Bee'] },
				BItem: { type: 'string', enum: ['b', 'c'], 'x-enumNames': ['Sibling Bee', 'C'] },
				AList: { type: 'array', items: { $ref: '#/$defs/AItem' } },
			},
			properties: {
				values: { $ref: '#/$defs/AList', items: { $ref: '#/$defs/BItem' } },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 'b', label: 'Sibling Bee' }]);
	});

	it('treats integer as the intersection of number and integer types', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: { Numeric: { type: 'number' } },
			properties: { count: { $ref: '#/$defs/Numeric', type: 'integer' } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0]).toMatchObject({ name: '/count', kind: 'integer' });
	});

	it('drops only conflicting nested properties while retaining valid siblings', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Shape: {
					type: 'object',
					required: ['bad', 'good'],
					properties: { bad: { type: 'string' }, good: { type: 'boolean' } },
				},
			},
			properties: {
				shape: { $ref: '#/$defs/Shape', properties: { bad: { type: 'number' } } },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toHaveLength(1);
		expect(result.fields[0]).toMatchObject({ name: '/shape/good', kind: 'boolean', required: true });
		expect(result.diagnostics.some((item) => item.code === 'invalid-schema')).toBe(true);
	});

	it('handles very deep acyclic schema graphs without overflowing the cycle scanner', () => {
		let deep: QueryJsonSchema = { type: 'string' };
		for (let index = 0; index < 12_000; index += 1) {
			deep = { type: 'object', properties: { nested: deep } };
		}
		const source: QueryJsonSchema = { type: 'object', properties: { deep } };
		const result = queryFieldsFromJsonSchema(source, { maxDepth: 1 });
		expect(result.diagnostics.some((item) => item.code === 'max-depth')).toBe(true);
	});

	it('rejects very deep local ref chains before exhausting the call stack', () => {
		const definitions: Record<string, QueryJsonSchema> = {};
		for (let index = 0; index < 3_000; index += 1) {
			definitions[`Ref${index}`] = index === 2_999 ? { type: 'string' } : { $ref: `#/$defs/Ref${index + 1}` };
		}
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: definitions,
			properties: { value: { $ref: '#/$defs/Ref0' } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toEqual([]);
		expect(result.diagnostics.some((item) => item.code === 'max-depth')).toBe(true);
	});

	it('normalizes non-finite and oversized maxDepth options', () => {
		let nested: QueryJsonSchema = { type: 'string' };
		for (let index = 0; index < 5_000; index += 1) {
			nested = { type: 'object', properties: { next: nested } };
		}
		const source: QueryJsonSchema = { type: 'object', properties: { root: nested } };
		for (const maxDepth of [Number.NaN, Number.POSITIVE_INFINITY, 10_000]) {
			const result = queryFieldsFromJsonSchema(source, { maxDepth });
			expect(result.diagnostics.some((item) => item.code === 'max-depth')).toBe(true);
		}
	});

	it('rejects impossible or non-finite direct oneOf option schemas', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			properties: {
				impossible: { oneOf: [{ const: 'a', enum: ['b'] }] },
				nonFinite: { type: 'string', oneOf: [{ type: 'string', pattern: '^a' } as QueryJsonSchema] },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toEqual([]);
		expect(result.diagnostics.filter((item) => item.code === 'invalid-schema').length).toBeGreaterThanOrEqual(2);
	});
});
