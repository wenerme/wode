import Ajv2020 from 'ajv/dist/2020.js';
import type { ContractRouterClient } from '@orpc/contract';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { toJsonSchema } from '../../schema';
import {
	HonchoRequestInputSchema, HonchoServiceContract, HonchoWriteOperations,
	type HonchoServiceClientContext, type HonchoServiceInputs, type IHonchoServiceContract,
} from './HonchoServiceContract';
import type { IHonchoService } from './IHonchoService';
import { HonchoOperations } from './operations';

describe('Honcho oRPC contract', () => {
	it('derives the service interface from the contract', () => {
		expectTypeOf<IHonchoServiceContract>().toEqualTypeOf<ContractRouterClient<typeof HonchoServiceContract, HonchoServiceClientContext>>();
		expectTypeOf<keyof IHonchoServiceContract>().toEqualTypeOf<keyof typeof HonchoServiceContract>();
		expectTypeOf<Parameters<IHonchoService['remember']>[0]>().toEqualTypeOf<HonchoServiceInputs['remember']>();
		expect(Object.keys(HonchoOperations)).toEqual(Object.keys(HonchoServiceContract));
	});

	it('marks write operations from metadata', () => {
		expect([...HonchoWriteOperations]).toEqual(['remember', 'createWorkspace', 'createPeer', 'createSession', 'request']);
	});

	it('defaults optional inputs and rejects invalid ones', () => {
		for (const name of ['listWorkspace', 'createWorkspace', 'listPeer', 'listSession', 'systemStatus'] as const)
			expect(HonchoServiceContract[name]['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(HonchoServiceContract.remember['~orpc'].inputSchema!.safeParse({ sessionId: 's', content: '  ' }).success).toBe(false);
		expect(HonchoServiceContract.createPeer['~orpc'].inputSchema!.safeParse({ id: 'p', metadata: JSON.parse('{"__proto__":{}}') }).success).toBe(false);
		expect(HonchoRequestInputSchema.safeParse({ path: '/a/../b' }).success).toBe(false);
		for (const method of ['GET', 'HEAD'] as const)
			expect(HonchoRequestInputSchema.safeParse({ path: '/x', method, body: {} }).success).toBe(false);
		expect(HonchoRequestInputSchema.safeParse({ path: '/x', method: 'POST', body: {} }).success).toBe(true);
	});

	it('exports AJV-compilable JSON Schemas and keeps supplier fields', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const procedure of Object.values(HonchoServiceContract)) {
			ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!));
			ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!));
		}
		const output = HonchoServiceContract.listPeer['~orpc'].outputSchema!.parse({ items: [{ id: 'p1', extra: 1 }], total: 1 });
		expect(output).toEqual({ items: [{ id: 'p1', extra: 1 }], total: 1 });
		expect(HonchoServiceContract.getSessionSummary['~orpc'].outputSchema!.safeParse({}).success).toBe(true);
	});
});
