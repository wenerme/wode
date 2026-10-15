import Ajv from 'ajv/dist/2020';
import { generate } from 'json-schema-faker';
import { expect, test } from 'vitest';
import { generationView } from './generation-view';

test('限制大数组和字符串采样，同时保留官方最小长度', () => {
	const schema = {
		type: 'object',
		properties: {
			items: { type: 'array', items: { type: 'string', maxLength: 10_485_760 }, maxItems: 131_072 },
			minimum: { type: 'array', items: { type: 'integer' }, minItems: 5, maxItems: 100 },
		},
	};
	const before = structuredClone(schema);
	const view = generationView(schema, {});
	expect(view.properties).toMatchObject({ items: { maxItems: 2, items: { maxLength: 64 } }, minimum: { maxItems: 5 } });
	expect(schema).toStrictEqual(before);
});

test('未声明下界的整数采样包含负数，保留官方显式下界', async () => {
	const schema = { type: 'integer' };
	const view = generationView(schema, {});
	expect(view.minimum).toBe(Number.MIN_SAFE_INTEGER);
	expect(generationView({ type: 'integer', minimum: 0 }, {}).minimum).toBe(0);
	const samples = await Promise.all(Array.from({ length: 8 }, (_, seed) => generate(view, { seed })));
	expect(samples.some((value) => typeof value === 'number' && value < 0)).toBe(true);
	expect(schema).toStrictEqual({ type: 'integer' });
});

test('生成器跳过不可能的 union 分支和可选属性，仍通过原始 oracle', async () => {
	const impossible = { not: {} };
	const schema = {
		type: 'object',
		properties: { value: { oneOf: [impossible, { type: 'string' }] }, impossible },
		required: ['value'],
	};
	const validate = new Ajv().compile(schema);
	for (let seed = 1; seed <= 8; seed++) {
		const sample = await generate(generationView(schema, {}, seed), { seed, alwaysFakeOptionals: true });
		expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
	}
});

test('递归采样有限且可重现，保留 ref 相邻约束', async () => {
	const definitions = {
		Node: {
			type: 'object',
			properties: { value: { type: 'integer' }, next: { $ref: '#/$defs/Node' } },
			required: ['value'],
		},
		Text: { type: 'string' },
	};
	const schema = {
		type: 'object',
		properties: { node: { $ref: '#/$defs/Node' }, text: { $ref: '#/$defs/Text', maxLength: 2 } },
		required: ['node', 'text'],
	};
	const view = generationView(schema, definitions, 42);
	expect(generationView(schema, definitions, 42)).toStrictEqual(view);
	const sample = await generate(view, { seed: 42, alwaysFakeOptionals: true });
	const validate = new Ajv({ strict: false }).compile({ ...schema, $defs: definitions });
	expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
});

test('无有限合法值的必需递归结构明确失败', () => {
	const definitions = { Node: { type: 'object', properties: { next: { $ref: '#/$defs/Node' } }, required: ['next'] } };
	expect(() => generationView({ $ref: '#/$defs/Node' }, definitions)).toThrow('no finite sample');
});

test('全字段采样仍满足官方互斥字段约束', async () => {
	const schema = {
		type: 'object',
		properties: { image_url: { type: 'string' }, file_id: { type: 'string' } },
		anyOf: [{ required: ['image_url'] }, { required: ['file_id'] }],
		not: { required: ['image_url', 'file_id'] },
		additionalProperties: false,
	};
	const validate = new Ajv({ strict: false }).compile(schema);
	for (let seed = 1; seed <= 8; seed++) {
		const sample = await generate(generationView(schema, {}, seed), { seed, alwaysFakeOptionals: true });
		expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
	}
});
