import type { ContractRouterClient } from '@orpc/contract';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import type { ISearchService } from './ISearchService';
import * as barrel from './index';
import { SearchOperations } from './operations';
import {
	type ISearchServiceContract,
	type SearchContentOptions,
	type SearchRequest,
	type SearchResponse,
	type SearchServiceClientContext,
	type SearchServiceInputs,
	type SearchServiceOutputs,
	SearchContentOptionsSchema,
	SearchRequestSchema,
	SearchResponseSchema,
	SearchServiceContract,
} from './SearchServiceContract';

describe('Search oRPC contract', () => {
	it('derives the stateless service methods, inputs and outputs from the contract', () => {
		expectTypeOf<ISearchServiceContract>().toEqualTypeOf<
			ContractRouterClient<typeof SearchServiceContract, SearchServiceClientContext>
		>();
		expectTypeOf<keyof ISearchServiceContract>().toEqualTypeOf<keyof typeof SearchServiceContract>();
		expectTypeOf<Omit<ISearchService, 'type' | 'readOnly' | 'close'>>().toEqualTypeOf<ISearchServiceContract>();
		expectTypeOf<ISearchService['readOnly']>().toEqualTypeOf<true>();
		expectTypeOf<Parameters<ISearchService['search']>[0]>().toEqualTypeOf<SearchServiceInputs['search']>();
		expectTypeOf<Awaited<ReturnType<ISearchService['search']>>>().toEqualTypeOf<SearchServiceOutputs['search']>();
		expectTypeOf<SearchRequest>().toEqualTypeOf<SearchServiceInputs['search']>();
		expectTypeOf<SearchResponse>().toEqualTypeOf<SearchServiceOutputs['search']>();
		expectTypeOf<{ query: string; urls: readonly string[]; includeDomains: readonly string[]; excludeDomains: readonly string[] }>()
			.toExtend<SearchRequest>();
		expectTypeOf<SearchContentOptions>().toEqualTypeOf<NonNullable<SearchRequest['content']>>();
		expectTypeOf<{ timeoutMs: number }>().not.toExtend<SearchServiceClientContext>();
	});

	it('preserves optional sync and async close hooks without requiring stateless providers to implement one', async () => {
		expectTypeOf<ISearchService['close']>().toEqualTypeOf<(() => void | Promise<void>) | undefined>();
		const closed: string[] = [];
		const stateless: ISearchService = {
			type: 'test',
			readOnly: true,
			async search() { return { items: [] }; },
		};
		const syncClose: ISearchService = {
			...stateless,
			close() { closed.push('sync'); },
		};
		const asyncClose: ISearchService = {
			...stateless,
			async close() { closed.push('async'); },
		};
		for (const service of [stateless, syncClose, asyncClose]) {
			await service.close?.();
		}
		expect(closed).toEqual(['sync', 'async']);
	});

	it('keeps required query and provider defaults without inventing an empty-input operation', () => {
		expect(SearchRequestSchema.safeParse(undefined).success).toBe(false);
		expect(SearchRequestSchema.safeParse({}).success).toBe(false);
		expect(SearchRequestSchema.safeParse({ query: '  ' }).success).toBe(false);
		expect(SearchRequestSchema.parse({ query: 'example' })).toEqual({ query: 'example' });
		expect(SearchContentOptionsSchema.parse({})).toEqual({});
		expect(SearchRequestSchema.parse({ query: 'example', content: {} })).toEqual({ query: 'example', content: {} });
	});

	it('re-exports the canonical contract from the barrel', () => {
		expect(barrel.SearchServiceContract).toBe(SearchServiceContract);
		expect(Object.keys(SearchServiceContract)).toEqual(['search']);
		expect(Object.keys(SearchOperations)).toEqual(Object.keys(SearchServiceContract));
	});

	it('validates the normalized envelope while preserving dynamic supplier fields', () => {
		const response = {
			items: [{
				url: 'https://example.test/page',
				title: 'Page',
				highlights: ['Highlight'],
				score: 0.9,
				metadata: { author: 'Author', nested: { flags: [true, null] } },
				subpages: [{ url: 'https://example.test/subpage', vendorField: 1 }],
				extras: { imageLinks: ['https://example.test/image.png'] },
			}],
			nextCursor: 'next',
			metadata: { query: 'example', source: 'future-provider', costDollars: { total: 0.01, vendorCost: [1, 2] } },
			raw: { results: [], output: { content: { vendorField: true } }, supplierExtension: ['anything'] },
			providerExtension: { futureField: null },
		};
		expect(SearchResponseSchema.parse(response)).toEqual(response);
		expect(SearchResponseSchema.parse({ items: [], raw: '<html>Supplier HTML</html>' })).toEqual({
			items: [], raw: '<html>Supplier HTML</html>',
		});
		for (const invalid of [{}, { items: {} }, { items: [{}] }, { items: [{ url: 1 }] }, { items: [], metadata: [] }]) {
			expect(SearchResponseSchema.safeParse(invalid).success).toBe(false);
		}
	});

	it('exports AJV-compilable input/output schemas and read-only metadata for every operation', () => {
		const ajv = new Ajv2020({ strict: false, validateFormats: false });
		for (const [name, procedure] of Object.entries(SearchServiceContract)) {
			const input = toJsonSchema(procedure['~orpc'].inputSchema!);
			const output = toJsonSchema(procedure['~orpc'].outputSchema!);
			const validateInput = ajv.compile(input);
			const validateOutput = ajv.compile(output);
			expect(validateInput({ query: 'example' })).toBe(true);
			expect(validateInput({})).toBe(false);
			expect(validateOutput({ items: [{ url: 'https://example.test', vendorField: { values: [1, null] } }] })).toBe(true);
			expect(validateOutput({ items: [{ title: 'Missing URL' }] })).toBe(false);
			expect(output.type).toBe('object');
			expect(output.required).toContain('items');
			expect(SearchOperations[name as keyof typeof SearchOperations].tool).toMatchObject({
				inputSchema: input,
				outputSchema: output,
				annotations: { readOnlyHint: true, destructiveHint: false },
			});
			expect(procedure['~orpc'].meta).toMatchObject({ readOnlyHint: true, destructiveHint: false });
		}
	});
});
