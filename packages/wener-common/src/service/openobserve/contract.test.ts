import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	OpenObserveHealthInputSchema,
	OpenObserveListStreamsOutputSchema,
	OpenObserveSearchOutputSchema,
	OpenObserveServiceContract,
	OpenObserveStreamSettingsOutputSchema,
	OpenObserveWriteOperations,
	type IOpenObserveServiceContract,
	type OpenObserveServiceClientContext,
	type OpenObserveServiceInputs,
	type OpenObserveServiceOutputs,
} from './OpenObserveServiceContract';
import type { IOpenObserveService } from './IOpenObserveService';

describe('OpenObserve service contract', () => {
	it('derives the service client and operation keys from the canonical contract', () => {
		expectTypeOf<IOpenObserveServiceContract>().toEqualTypeOf<ContractRouterClient<typeof OpenObserveServiceContract, OpenObserveServiceClientContext>>();
		expectTypeOf<keyof IOpenObserveServiceContract>().toEqualTypeOf<keyof typeof OpenObserveServiceContract>();
		expectTypeOf<Parameters<IOpenObserveService['search']>[0]>().toEqualTypeOf<OpenObserveServiceInputs['search']>();
		expectTypeOf<Awaited<ReturnType<IOpenObserveService['search']>>>().toEqualTypeOf<OpenObserveServiceOutputs['search']>();
	});

	it('uses empty defaults and keeps query, stream and write inputs strict', () => {
		expect(OpenObserveHealthInputSchema.parse(undefined)).toEqual({});
		expect(OpenObserveServiceContract.status['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(OpenObserveServiceContract.listStreams['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(OpenObserveServiceContract.search['~orpc'].inputSchema!.safeParse({ sql: 'SELECT 1' }).success).toBe(false);
		expect(OpenObserveServiceContract.updateStreamSettings['~orpc'].inputSchema!.safeParse({ stream: 'app', settings: { unknown: true } }).success).toBe(false);
	});

	it('compiles all contract schemas, preserves metadata, and keeps all 13 operations', () => {
		const ajv = new Ajv2020({ strict: false });
		const keys = ['health', 'status', 'listStreams', 'getStreamSchema', 'search', 'listTraces', 'getStreamSettings', 'updateStreamSettings', 'deleteStream', 'ingestJson', 'ingestMulti', 'getValues', 'searchAround'] as const;
		expect(Object.keys(OpenObserveServiceContract)).toEqual(keys);
		for (const name of keys) {
			const procedure = OpenObserveServiceContract[name];
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
		}
		expect(OpenObserveWriteOperations).toEqual(new Set(['updateStreamSettings', 'deleteStream', 'ingestJson', 'ingestMulti']));
		expect(OpenObserveServiceContract.search['~orpc'].meta).toMatchObject({ readOnlyHint: true, destructiveHint: false });
		expect(OpenObserveServiceContract.ingestJson['~orpc'].meta).toMatchObject({ readOnlyHint: false, destructiveHint: false });
		expect(OpenObserveServiceContract.deleteStream['~orpc'].meta).toMatchObject({ readOnlyHint: false, destructiveHint: true });
	});

	it('retains stable envelopes while accepting dynamic query and settings data', () => {
		expect(OpenObserveSearchOutputSchema.parse({
			streamType: 'logs', hits: [{ message: 'fixture', nested: { value: 1 } }], total: 1, from: 0, size: 100,
			isPartial: false, functionErrors: [],
		})).toMatchObject({ hits: [{ nested: { value: 1 } }] });
		expect(OpenObserveListStreamsOutputSchema.parse({
			streams: [{ organization: 'default', name: 'app', streamType: 'logs', schemaFields: [], providerField: { dynamic: true } }], total: 1,
		})).toMatchObject({ streams: [{ providerField: { dynamic: true } }] });
	});

	it('accepts settings that omit optional partition configuration', () => {
		const settings = { organization: 'default', stream: 'app', streamType: 'logs', settings: { data_retention: 7 } };
		expect(OpenObserveStreamSettingsOutputSchema.parse(settings)).toEqual(settings);
		const validate = new Ajv2020({ strict: false }).compile(toJsonSchema(OpenObserveStreamSettingsOutputSchema));
		expect(validate(settings)).toBe(true);
		expect(OpenObserveStreamSettingsOutputSchema.parse({ ...settings, settings: { partition_keys: [{ field: 'service' }] } })).toMatchObject({
			settings: { partition_keys: [{ field: 'service' }] },
		});
	});
});
