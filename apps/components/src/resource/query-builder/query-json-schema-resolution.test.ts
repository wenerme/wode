import { describe, expect, it } from 'vite-plus/test';
import type { QueryJsonSchema } from './query-json-schema';
import { queryFieldsFromJsonSchema } from './query-json-schema';

describe('JSON Schema 引用与约束规范化', () => {
	it('解析 URI 编码的本地 JSON Pointer 并合并引用 sibling', () => {
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
				template: { type: 'object', properties: { code: { type: 'string', title: 'Code' } } },
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

	it('拒绝无效 pointer escape 与嵌套 sibling 类型冲突', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Shape: { type: 'object', properties: { value: { type: 'string' } } },
				'a~b': { type: 'string' },
			},
			properties: {
				goodEscape: { $ref: '#/$defs/a~0b' },
				badEscape: { $ref: '#/$defs/a~2b' },
				conflict: { $ref: '#/$defs/Shape', properties: { value: { type: 'number' } } },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields.map((field) => field.name)).toEqual(['/goodEscape']);
		expect(result.diagnostics.some((item) => item.code === 'unresolved-ref' && item.ref === '#/$defs/a~2b')).toBe(true);
		expect(
			result.diagnostics.some((item) => item.code === 'invalid-schema' && item.path.endsWith('/properties/value')),
		).toBe(true);
	});

	it('合取引用 sibling 的 type 与 enum 约束', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: { Choice: { type: ['string', 'number'], enum: ['a', 'b'] } },
			properties: { choice: { $ref: '#/$defs/Choice', type: 'string', enum: ['b', 'c'] } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0]).toMatchObject({
			name: '/choice',
			kind: 'enum',
			options: [{ value: 'b', label: 'b' }],
		});
	});

	it('对 unresolved array items、继承 pointer 与 nested oneOf ref fail closed', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			properties: {
				array: { type: 'array', items: { $ref: '#/$defs/MissingItem' } },
				inherited: { $ref: '#/__proto__' },
				choice: { type: 'string', oneOf: [{ $ref: '#/$defs/MissingChoice' }] },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toEqual([]);
		expect(result.diagnostics.filter((item) => item.code === 'unresolved-ref')).toHaveLength(3);
	});

	it('拒绝无法安全求交的 oneOf、enum、const 与 type 组合', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: { EnumChoice: { enum: ['a'] }, Constant: { const: 'a' } },
			properties: {
				oneOfConflict: { $ref: '#/$defs/EnumChoice', oneOf: [{ const: 'b' }] },
				constTypeConflict: { $ref: '#/$defs/Constant', type: 'number' },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toEqual([]);
		expect(result.diagnostics.filter((item) => item.code === 'invalid-schema')).toHaveLength(2);
	});

	it('合取直接 enum、const 与 oneOf 值约束', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			properties: {
				value: { type: 'number', enum: [1, 2], const: 2, oneOf: [{ const: 2, title: 'Two' }] },
			},
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 2, label: '2' }]);
	});

	it('支持本地 JSON Pointer 的数组 token', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: { Variants: { oneOf: [{ type: 'string', title: 'Variant' }] } },
			properties: { variant: { $ref: '#/%24defs/Variants/oneOf/0' } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0]).toMatchObject({ name: '/variant', label: 'Variant', kind: 'string' });
	});

	it('拒绝 properties 与 items 中的直接 schema object cycle', () => {
		const cyclicObject = { type: 'object', properties: {} } as unknown as QueryJsonSchema;
		(cyclicObject.properties as Record<string, QueryJsonSchema>).self = cyclicObject;
		const cyclicArray = { type: 'array' } as QueryJsonSchema;
		cyclicArray.items = cyclicArray;
		const result = queryFieldsFromJsonSchema({
			type: 'object',
			properties: { cyclicObject, cyclicArray },
		});
		expect(result.fields).toEqual([]);
		expect(
			result.diagnostics.filter(
				(item) => item.code === 'invalid-schema' && item.message === 'Schema object cycles are not supported.',
			).length,
		).toBeGreaterThanOrEqual(2);
	});

	it('在合取 sibling 约束前规范化 finite oneOf ref', () => {
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
			properties: { value: { $ref: '#/$defs/Finite', type: 'string', enum: ['b'] } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 'b', label: 'Beta' }]);
	});

	it('在 sibling type 过滤值时保持 enum label 对齐', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: { Mixed: { type: ['number', 'string'], enum: [1, 'a'], 'x-enumNames': ['One', 'Alpha'] } },
			properties: { value: { $ref: '#/$defs/Mixed', type: 'string' } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 'a', label: 'Alpha' }]);
	});

	it('递归合取引用 sibling 的 array items', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Tags: { type: 'array', items: { type: 'string', enum: ['x', 'y'], 'x-enumNames': ['Ex', 'Why'] } },
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

	it('在递归合取前解析双方 item ref', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				AItem: { type: 'string', enum: ['a', 'b'], 'x-enumNames': ['A', 'Bee'] },
				BItem: { type: 'string', enum: ['b', 'c'], 'x-enumNames': ['Sibling Bee', 'C'] },
				AList: { type: 'array', items: { $ref: '#/$defs/AItem' } },
			},
			properties: { values: { $ref: '#/$defs/AList', items: { $ref: '#/$defs/BItem' } } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0].options).toEqual([{ value: 'b', label: 'Sibling Bee' }]);
	});

	it('将 integer 作为 number 与 integer 的交集', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: { Numeric: { type: 'number' } },
			properties: { count: { $ref: '#/$defs/Numeric', type: 'integer' } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.diagnostics).toEqual([]);
		expect(result.fields[0]).toMatchObject({ name: '/count', kind: 'integer' });
	});

	it('只删除冲突 nested property 并保留有效 sibling', () => {
		const source: QueryJsonSchema = {
			type: 'object',
			$defs: {
				Shape: {
					type: 'object',
					required: ['bad', 'good'],
					properties: { bad: { type: 'string' }, good: { type: 'boolean' } },
				},
			},
			properties: { shape: { $ref: '#/$defs/Shape', properties: { bad: { type: 'number' } } } },
		};
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toHaveLength(1);
		expect(result.fields[0]).toMatchObject({ name: '/shape/good', kind: 'boolean', required: true });
		expect(result.diagnostics.some((item) => item.code === 'invalid-schema')).toBe(true);
	});
});

describe('JSON Schema 有界遍历', () => {
	it('扫描超深无环 schema graph 时不会耗尽调用栈', () => {
		let deep: QueryJsonSchema = { type: 'string' };
		for (let index = 0; index < 12_000; index += 1) deep = { type: 'object', properties: { nested: deep } };
		const result = queryFieldsFromJsonSchema({ type: 'object', properties: { deep } }, { maxDepth: 1 });
		expect(result.diagnostics.some((item) => item.code === 'max-depth')).toBe(true);
	});

	it('在耗尽调用栈前拒绝超深 local ref chain', () => {
		const definitions: Record<string, QueryJsonSchema> = {};
		for (let index = 0; index < 3_000; index += 1) {
			definitions[`Ref${index}`] = index === 2_999 ? { type: 'string' } : { $ref: `#/$defs/Ref${index + 1}` };
		}
		const result = queryFieldsFromJsonSchema({
			type: 'object',
			$defs: definitions,
			properties: { value: { $ref: '#/$defs/Ref0' } },
		});
		expect(result.fields).toEqual([]);
		expect(result.diagnostics.some((item) => item.code === 'max-depth')).toBe(true);
	});

	it('规范化非有限和超大 maxDepth', () => {
		let nested: QueryJsonSchema = { type: 'string' };
		for (let index = 0; index < 5_000; index += 1) nested = { type: 'object', properties: { next: nested } };
		const source: QueryJsonSchema = { type: 'object', properties: { root: nested } };
		for (const maxDepth of [Number.NaN, Number.POSITIVE_INFINITY, 10_000]) {
			const result = queryFieldsFromJsonSchema(source, { maxDepth });
			expect(result.diagnostics.some((item) => item.code === 'max-depth')).toBe(true);
		}
	});

	it('拒绝不可能或非有限的直接 oneOf option schema', () => {
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
