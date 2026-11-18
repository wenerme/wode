import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import { ClsOperations } from './operations';
import {
	TencentClsListTopicInputSchema,
	TencentClsListTopicOutputSchema,
	TencentClsQueryInputSchema,
	TencentClsQueryOutputSchema,
	TencentClsReadOnlyOperations,
	TencentClsServiceContract,
	type TencentClsServiceClientContext,
	type TencentClsServiceInputs,
	type TencentClsServiceOutputs,
	type ITencentClsServiceContract,
} from './TencentClsServiceContract';
import type { ITencentClsService } from './ITencentClsService';

describe('Tencent CLS service contract', () => {
	it('derives the service contract client and service method keys', () => {
		expectTypeOf<ITencentClsServiceContract>().toEqualTypeOf<ContractRouterClient<typeof TencentClsServiceContract, TencentClsServiceClientContext>>();
		expectTypeOf<keyof ITencentClsServiceContract>().toEqualTypeOf<keyof typeof TencentClsServiceContract>();
		expectTypeOf<Parameters<ITencentClsService['query']>[0]>().toEqualTypeOf<TencentClsServiceInputs['query']>();
		expectTypeOf<Parameters<ITencentClsService['listTopic']>[0]>().toEqualTypeOf<TencentClsServiceInputs['listTopic']>();
		expectTypeOf<Awaited<ReturnType<ITencentClsService['query']>>>().toEqualTypeOf<TencentClsServiceOutputs['query']>();
		expectTypeOf<Awaited<ReturnType<ITencentClsService['listTopic']>>>().toEqualTypeOf<TencentClsServiceOutputs['listTopic']>();
	});

	it('uses a default for the options-only listTopic input', () => {
		expect(TencentClsListTopicInputSchema.parse(undefined)).toEqual({});
		expect(TencentClsQueryInputSchema.safeParse(undefined).success).toBe(false);
	});

	it('keeps stable envelopes while leaving dynamic records unconstrained', () => {
		const query = {
			RequestId: 'request-1', Context: 'cursor-1', ListOver: true,
			Results: [{ DynamicField: { nested: true } }],
			Columns: [{ Name: 'count', DynamicType: 'number' }],
		};
		expect(TencentClsQueryOutputSchema.parse(query)).toEqual(query);
		expect(TencentClsQueryOutputSchema.safeParse({ RequestId: 'request-1', Context: '', ListOver: true }).success).toBe(true);
		expect(TencentClsQueryOutputSchema.safeParse({ RequestId: 'request-1', ListOver: true }).success).toBe(false);
		expect(TencentClsListTopicOutputSchema.parse({ RequestId: 'request-1', TotalCount: 1, Topics: [{ TopicName: 'dynamic' }] })).toEqual({
			RequestId: 'request-1', TotalCount: 1, Topics: [{ TopicName: 'dynamic' }],
		});
	});

	it('validates inputs and exports compilable JSON Schema/AJV', () => {
		expect(TencentClsQueryInputSchema.safeParse({ topic: ['topic'], query: '*', from: 10, to: 10 }).success).toBe(false);
		expect(TencentClsQueryInputSchema.safeParse({ topic: ['topic'], query: '*', from: 0, to: 10 }).success).toBe(true);
		expect(TencentClsListTopicInputSchema.safeParse({ unknown: true }).success).toBe(false);
		const ajv = new Ajv2020({ strict: false });
		for (const procedure of Object.values(TencentClsServiceContract)) {
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
			expect(procedure['~orpc'].meta.readOnlyHint).toBe(true);
		}
	});

	it('keeps the operation keys and read-only metadata aligned', () => {
		expect(Object.keys(ClsOperations)).toEqual(['query', 'listTopic']);
		expect([...TencentClsReadOnlyOperations]).toEqual(['query', 'listTopic']);
	});
});
