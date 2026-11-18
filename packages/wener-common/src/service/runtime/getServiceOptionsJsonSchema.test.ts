import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ExaServiceProvider } from '../provider/exa/ExaServiceProvider';
import { SqlServiceProvider } from '../sql/SqlServiceProvider';
import { createServiceProviderAdapter } from './createServiceProviderAdapter';
import { getServiceOptionsJsonSchema } from './getServiceOptionsJsonSchema';
import type { ServiceOptionsSchema } from './types';

describe('static service options JSON schema', () => {
	it('prefers explicit metadata, clones it and never validates', () => {
		const schema = {
			jsonSchema: { type: 'object', properties: { explicit: { type: 'string' } } },
			safeParse: vi.fn((): never => { throw new Error('must not validate'); }),
			toJSONSchema: vi.fn((): never => { throw new Error('explicit metadata wins'); }),
		};
		const first = getServiceOptionsJsonSchema(schema)!;
		first.type = 'string';
		expect(getServiceOptionsJsonSchema(schema)).toEqual(schema.jsonSchema);
		expect(schema.safeParse).not.toHaveBeenCalled();
		expect(schema.toJSONSchema).not.toHaveBeenCalled();
	});

	it('uses the bound instance input-schema method and keeps opaque validators opaque', () => {
		const schema: ServiceOptionsSchema & { marker: string } = {
			marker: 'input-schema',
			safeParse: vi.fn(() => ({ success: true, data: {} })),
			toJSONSchema(options) {
				expect(this.marker).toBe('input-schema');
				expect(options).toEqual({ io: 'input' });
				return { type: 'object' };
			},
		};
		expect(getServiceOptionsJsonSchema(schema)).toEqual({ type: 'object' });
		expect(getServiceOptionsJsonSchema({ safeParse: schema.safeParse })).toBeUndefined();
		expect(getServiceOptionsJsonSchema(undefined)).toBeUndefined();
		expect(schema.safeParse).not.toHaveBeenCalled();
	});

	it('exports raw Zod input schemas, including defaults and transforms', () => {
		const schema = z.strictObject({ count: z.string().default('10').transform(Number) });
		const json = getServiceOptionsJsonSchema(schema);
		expect(json).toMatchObject({ type: 'object', properties: { count: { type: 'string', default: '10' } } });
	});

	it.each([
		{ provider: SqlServiceProvider, fields: ['dialect', 'filename', 'timeoutMs', 'connectTimeoutMs', 'maxRowLimit', 'ssl'] },
		{ provider: ExaServiceProvider, fields: ['apiKey', 'timeout'] },
	])('exports all static options for $provider.name without factories or safeParse', ({ provider, fields }) => {
		const create = vi.spyOn(provider, 'create');
		const safeParse = vi.spyOn(provider.optionsSchema!, 'safeParse');
		const adapter = createServiceProviderAdapter(provider);
		const json = getServiceOptionsJsonSchema(adapter.optionsSchema)!;
		for (const field of fields) expect(json.properties).toHaveProperty(field);
		expect(create).not.toHaveBeenCalled();
		expect(safeParse).not.toHaveBeenCalled();
		create.mockRestore();
		safeParse.mockRestore();
	});

	it('preserves safeParse receiver binding in adapter wrappers', () => {
		const schema: ServiceOptionsSchema & { marker: string } = {
			marker: 'original receiver', jsonSchema: { type: 'object' },
			safeParse(value) { return { success: true, data: { marker: this.marker, value } }; },
		};
		const adapter = createServiceProviderAdapter({ name: 'bound', provides: ['search'], optionsSchema: schema,
			create() { throw new Error('must stay static'); } });
		expect(adapter.optionsSchema!.safeParse('value')).toEqual({ success: true, data: { marker: 'original receiver', value: 'value' } });
		expect(adapter.optionsSchema!.jsonSchema).toEqual(schema.jsonSchema);
		expect(adapter.optionsSchema!.jsonSchema).not.toBe(schema.jsonSchema);
	});
});
