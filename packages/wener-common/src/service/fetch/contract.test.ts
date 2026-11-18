import type { ContractRouterClient } from '@orpc/contract';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	FetchRequestSchema,
	FetchResponseSchema,
	FetchServiceContract,
	type FetchRequest,
	type FetchResponse,
	type FetchServiceCallOptions,
	type FetchServiceClientContext,
	type IFetchServiceContract,
} from './FetchServiceContract';
import type {
	FetchRequest as LegacyFetchRequest,
	FetchResponse as LegacyFetchResponse,
	IFetchService,
} from './IFetchService';
import { FetchServiceContract as BarrelFetchServiceContract } from './index';
import { FetchOperations } from './operations';

describe('Fetch service contract', () => {
	it('derives the contract client and preserves the public request/response types', () => {
		expectTypeOf<IFetchServiceContract>().toEqualTypeOf<
			ContractRouterClient<typeof FetchServiceContract, FetchServiceClientContext>
		>();
		expectTypeOf<keyof IFetchServiceContract>().toEqualTypeOf<keyof typeof FetchServiceContract>();
		expectTypeOf<IFetchService['fetch']>().toEqualTypeOf<IFetchServiceContract['fetch']>();
		expectTypeOf<Parameters<IFetchService['fetch']>[0]>().toEqualTypeOf<FetchRequest>();
		expectTypeOf<Awaited<ReturnType<IFetchService['fetch']>>>().toEqualTypeOf<FetchResponse>();
		expectTypeOf<LegacyFetchRequest>().toEqualTypeOf<FetchRequest>();
		expectTypeOf<LegacyFetchResponse>().toEqualTypeOf<FetchResponse>();
		expectTypeOf<FetchServiceCallOptions['signal']>().toEqualTypeOf<AbortSignal | undefined>();
		expectTypeOf<FetchServiceClientContext['timeoutMs']>().toEqualTypeOf<never>();
	});

	it('keeps stateless lifecycle fields without requiring close or AsyncDisposable', () => {
		expectTypeOf<Exclude<keyof IFetchService, keyof IFetchServiceContract>>().toEqualTypeOf<
			'type' | 'readOnly' | 'close'
		>();
		expectTypeOf<IFetchService['close']>().toEqualTypeOf<(() => void | Promise<void>) | undefined>();
		expectTypeOf<Extract<keyof IFetchService, typeof Symbol.asyncDispose>>().toEqualTypeOf<never>();
		const service: IFetchService = {
			type: 'fixture',
			readOnly: true,
			async fetch({ url }) { return { url, content: '' }; },
		};
		expect(service.close).toBeUndefined();
		expect(Symbol.asyncDispose in service).toBe(false);
	});

	it('requires input and URL without introducing defaults for optional flags', () => {
		expect(FetchRequestSchema.safeParse(undefined).success).toBe(false);
		expect(FetchRequestSchema.safeParse({}).success).toBe(false);
		expect(FetchOperations.fetch.input.safeParse(undefined).success).toBe(false);
		expect(FetchRequestSchema.parse({ url: 'https://example.test' })).toEqual({ url: 'https://example.test' });
		for (const input of [
			{ url: 'ftp://example.test' },
			{ url: 'https://user:password@example.test' },
			{ url: 'https://example.test', unknown: true },
		]) expect(FetchRequestSchema.safeParse(input).success).toBe(false);
	});

	it('structures normalized text and metadata while preserving arbitrary raw supplier values', () => {
		const result: FetchResponse = {
			url: 'https://example.test', content: '# Page\nBody', contentType: 'text/markdown',
			title: 'Page', summary: 'Summary', highlights: ['Body'], description: 'Description',
			publishedDate: 'provider-specific date', author: 'Author',
			metadata: { status: 200, costDollars: { total: 0.01 }, extensions: [true, null] },
			raw: { arbitrary: { nested: ['value', 1, false, null] } },
		};
		expect(FetchResponseSchema.parse(result)).toEqual(result);
		for (const raw of [null, true, 1, 'text', [], { vendor: true }]) {
			expect(FetchResponseSchema.parse({ url: '', content: '', raw }).raw).toEqual(raw);
		}
		for (const invalid of [
			{ url: 'https://example.test' },
			{ content: 'Body' },
			{ url: 'https://example.test', content: 1 },
			{ url: 'https://example.test', content: '', highlights: [1] },
			{ url: 'https://example.test', content: '', metadata: [] },
		]) expect(FetchResponseSchema.safeParse(invalid).success).toBe(false);
	});

	it('exports compilable AJV input/output schemas and validates the stable envelope', () => {
		const ajv = new Ajv2020({ strict: false });
		addFormats(ajv);
		const inputSchema = toJsonSchema(FetchServiceContract.fetch['~orpc'].inputSchema!);
		const outputSchema = toJsonSchema(FetchServiceContract.fetch['~orpc'].outputSchema!);
		const validateInput = ajv.compile(inputSchema);
		const validateOutput = ajv.compile(outputSchema);
		expect(inputSchema).not.toHaveProperty('default');
		expect(inputSchema.required).toEqual(['url']);
		expect(outputSchema.required).toEqual(['content', 'url']);
		expect(validateInput({ url: 'https://example.test', main: false, raw: true })).toBe(true);
		for (const invalid of [{}, { url: 1 }, { url: 'invalid' }, { url: 'https://example.test', main: 'yes' }]) {
			expect(validateInput(invalid)).toBe(false);
		}
		for (const raw of [undefined, null, true, 1, 'text', [], { vendor: { nested: [1, null] } }]) {
			expect(validateOutput({ url: 'https://example.test', content: '', metadata: { any: [1, null] }, raw })).toBe(true);
		}
		for (const invalid of [
			{}, { url: 'https://example.test' }, { url: 'https://example.test', content: 1 },
			{ url: 'https://example.test', content: '', highlights: [1] },
		]) expect(validateOutput(invalid)).toBe(false);
	});

	it('keeps operation keys, tool metadata and compatibility shim identity aligned', () => {
		expect(Object.keys(FetchServiceContract)).toEqual(['fetch']);
		expect(Object.keys(FetchOperations)).toEqual(Object.keys(FetchServiceContract));
		expect(FetchOperations.fetch.tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
		expect(FetchOperations.fetch.tool.outputSchema).toEqual(toJsonSchema(FetchResponseSchema));
		expect(BarrelFetchServiceContract).toBe(FetchServiceContract);
	});
});
