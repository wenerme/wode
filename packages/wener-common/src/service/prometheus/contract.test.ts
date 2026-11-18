import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	PrometheusLabelsInputSchema,
	PrometheusMetadataInputSchema,
	PrometheusQueryOutputSchema,
	PrometheusServiceContract,
} from './PrometheusServiceContract';
import type {
	IPrometheusServiceContract,
	PrometheusServiceClientContext,
	PrometheusServiceInputs,
	PrometheusServiceOutputs,
} from './PrometheusServiceContract';
import type { IPrometheusService } from './IPrometheusService';

describe('Prometheus oRPC contract', () => {
	it('derives service methods and outputs from the contract', () => {
		expectTypeOf<IPrometheusServiceContract>().toEqualTypeOf<ContractRouterClient<typeof PrometheusServiceContract, PrometheusServiceClientContext>>();
		expectTypeOf<keyof IPrometheusServiceContract>().toEqualTypeOf<keyof typeof PrometheusServiceContract>();
		expectTypeOf<Parameters<IPrometheusService['query']>[0]>().toEqualTypeOf<PrometheusServiceInputs['query']>();
		expectTypeOf<Awaited<ReturnType<IPrometheusService['metadata']>>>().toEqualTypeOf<PrometheusServiceOutputs['metadata']>();
	});

	it('normalizes optional labels and metadata inputs through contract defaults', () => {
		expect(PrometheusLabelsInputSchema.parse(undefined)).toEqual({});
		expect(PrometheusMetadataInputSchema.parse(undefined)).toEqual({});
	});

	it('describes every response with a stable envelope and preserves dynamic metric data', () => {
		const query = {
			status: 'success' as const,
			data: { resultType: 'vector' as const, result: [{ metric: { __name__: 'up', job: 'prometheus' }, value: [1, '1'] as [number, string] }] },
			warnings: [],
		};
		expect(PrometheusQueryOutputSchema.parse(query)).toEqual(query);
		expect(PrometheusQueryOutputSchema.safeParse({ ...query, data: { resultType: 'vector', result: [{ metric: [], value: [1, '1'] }] } }).success).toBe(false);

		const ajv = new Ajv2020({ strict: false });
		for (const procedure of Object.values(PrometheusServiceContract)) {
			const output = toJsonSchema(procedure['~orpc'].outputSchema!);
			expect(output.type || output.anyOf).toBeTruthy();
			expect(() => ajv.compile(output)).not.toThrow();
		}
	});

	it('marks all procedures as read-only', () => {
		for (const procedure of Object.values(PrometheusServiceContract)) {
			expect(procedure['~orpc'].meta).toMatchObject({ readOnlyHint: true, destructiveHint: false });
		}
	});
});
