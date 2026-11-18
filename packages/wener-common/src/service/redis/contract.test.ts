import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	RedisGetOutputSchema,
	RedisPingInputSchema,
	RedisServiceContract,
	type IRedisServiceContract,
	type RedisServiceClientContext,
	type RedisServiceInputs,
	type RedisServiceOutputs,
} from './RedisServiceContract';
import type { IRedisService } from './IRedisService';

describe('Redis oRPC contract', () => {
	it('derives the service interface and operation keys from the native contract', () => {
		expectTypeOf<IRedisServiceContract>().toEqualTypeOf<ContractRouterClient<typeof RedisServiceContract, RedisServiceClientContext>>();
		expectTypeOf<keyof IRedisServiceContract>().toEqualTypeOf<keyof typeof RedisServiceContract>();
		expectTypeOf<Parameters<IRedisService['get']>[0]>().toEqualTypeOf<RedisServiceInputs['get']>();
		expectTypeOf<Awaited<ReturnType<IRedisService['get']>>>().toEqualTypeOf<RedisServiceOutputs['get']>();
	});

	it('uses defaults for empty Redis inputs and keeps required inputs required', () => {
		expect(RedisPingInputSchema.parse(undefined)).toEqual({});
		expect(RedisServiceContract.scan['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(RedisServiceContract.get['~orpc'].inputSchema!.safeParse(undefined).success).toBe(false);
	});

	it('compiles every input/output JSON Schema with AJV and marks every operation read-only', () => {
		const ajv = new Ajv2020({ strict: false });
		const keys = ['ping', 'get', 'getType', 'getTtl', 'scan', 'getHash', 'rangeStream'] as const;
		expect(Object.keys(RedisServiceContract)).toEqual(keys);
		for (const name of keys) {
			const procedure = RedisServiceContract[name];
			expect(procedure['~orpc'].meta).toMatchObject({ readOnlyHint: true, destructiveHint: false });
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
		}
	});

	it('accepts an omitted value in the get output', () => {
		expect(RedisGetOutputSchema.parse({ durationMs: 0 })).toEqual({ durationMs: 0 });
	});
});
