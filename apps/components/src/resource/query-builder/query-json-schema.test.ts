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
		tags: { type: 'array', items: { type: 'string', enum: ['priority', 'renewal'] } },
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

describe('JSON Schema 字段目录', () => {
	it('将嵌套对象展开为稳定的 JSON Pointer 字段', () => {
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

	it('在引用规范化后保留原型敏感属性名', () => {
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
			{ type: 'object', properties: { alias: { type: 'string', 'x-query': { field: 'constructor' } } } },
			{ fieldOverrides: {} },
		);
		expect(inheritedOverride.fields[0]?.name).toBe('constructor');
	});

	it('支持 oneOf 常量、字段覆盖、include 与 map hook', () => {
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

	it('对远程、缺失、循环、深度和扩展问题给出诊断且不产生静默字段', () => {
		const invalid: QueryJsonSchema = {
			type: 'object',
			$defs: { Cycle: { $ref: '#/$defs/Cycle' } },
			properties: {
				remote: { $ref: 'https://example.com/schema.json' },
				missing: { $ref: '#/$defs/Missing' },
				cycle: { $ref: '#/$defs/Cycle' },
				unknownExtension: { type: 'string', 'x-query': { unsupported: true } },
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

	it('拒绝无效 x-query operators 但保留字段', () => {
		const source = {
			type: 'object',
			properties: { name: { type: 'string', 'x-query': { operators: 'eq' } } },
		} as unknown as QueryJsonSchema;
		const result = queryFieldsFromJsonSchema(source);
		expect(result.fields).toHaveLength(1);
		expect(result.fields[0].operators).toBeUndefined();
		expect(result.diagnostics.some((item) => item.code === 'invalid-extension')).toBe(true);
	});

	it('忽略无效扩展值并拒绝重复字段别名', () => {
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

	it('对运行时 malformed schema 节点给出诊断而不抛异常', () => {
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
});
