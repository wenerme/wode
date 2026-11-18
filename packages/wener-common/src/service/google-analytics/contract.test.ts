import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import type { IGoogleAnalyticsService } from './IGoogleAnalyticsService';
import {
	GoogleAnalyticsAccountSummariesInputSchema,
	GoogleAnalyticsPropertyInputSchema,
	GoogleAnalyticsRealtimeReportInputSchema,
	GoogleAnalyticsReportOutputSchema,
	GoogleAnalyticsServiceContract,
	type GoogleAnalyticsServiceClientContext,
	type GoogleAnalyticsServiceInputs,
	type GoogleAnalyticsServiceOutputs,
	type IGoogleAnalyticsServiceContract,
} from './GoogleAnalyticsServiceContract';
import { GoogleAnalyticsOperations } from './operations';

describe('Google Analytics oRPC contract', () => {
	it('derives service methods from the contract and aligns operation keys', () => {
		expectTypeOf<IGoogleAnalyticsServiceContract>().toEqualTypeOf<ContractRouterClient<typeof GoogleAnalyticsServiceContract, GoogleAnalyticsServiceClientContext>>();
		expectTypeOf<keyof IGoogleAnalyticsServiceContract>().toEqualTypeOf<keyof typeof GoogleAnalyticsServiceContract>();
		expectTypeOf<Parameters<IGoogleAnalyticsService['runReport']>[0]>().toEqualTypeOf<GoogleAnalyticsServiceInputs['runReport']>();
		expectTypeOf<Awaited<ReturnType<IGoogleAnalyticsService['getMetadata']>>>().toEqualTypeOf<GoogleAnalyticsServiceOutputs['getMetadata']>();
		expect(Object.keys(GoogleAnalyticsOperations).sort()).toEqual(Object.keys(GoogleAnalyticsServiceContract).sort());
	});

	it('defaults omitted account summaries input and normalizes property IDs', () => {
		expect(GoogleAnalyticsAccountSummariesInputSchema.parse(undefined)).toEqual({});
		expect(GoogleAnalyticsPropertyInputSchema.parse({ propertyId: 'properties/123' })).toEqual({ propertyId: '123' });
		expect(GoogleAnalyticsPropertyInputSchema.safeParse({ propertyId: 'G-ABC' }).success).toBe(false);
		expect(GoogleAnalyticsRealtimeReportInputSchema.safeParse({ propertyId: '1', dimensions: ['a'], metrics: ['b'], offset: 1 }).success).toBe(false);
	});

	it('keeps optional envelope fields omittable and dynamic parts open', () => {
		expect(GoogleAnalyticsReportOutputSchema.parse({})).toEqual({});
		const report = { rows: [{ dimensionValues: [{ value: 'x', oneValue: 'y' }] }], extra: { any: 1 } };
		expect(GoogleAnalyticsReportOutputSchema.parse(report)).toEqual(report);
		expect(GoogleAnalyticsReportOutputSchema.safeParse({ rowCount: 'many' }).success).toBe(false);
	});

	it('exports AJV-compilable input/output schemas and read-only metadata', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const procedure of Object.values(GoogleAnalyticsServiceContract)) {
			const input = toJsonSchema(procedure['~orpc'].inputSchema!);
			const output = toJsonSchema(procedure['~orpc'].outputSchema!);
			expect(() => ajv.compile(input)).not.toThrow();
			expect(() => ajv.compile(output)).not.toThrow();
			expect(ajv.validate(output, {})).toBe(true);
			expect(procedure['~orpc'].meta).toMatchObject({ readOnlyHint: true, destructiveHint: false });
		}
	});
});
