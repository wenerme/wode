import type { ContractRouterClient } from '@orpc/contract';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { toJsonSchema } from '../../schema';
import { LinearServiceContract as publicContract, LinearTools as publicTools } from './index';
import {
	LinearMethodInputs, LinearMethodOutputs, LinearServiceContract, LinearStaticServiceContract, LinearTools,
	LinearWriteOperations, type ILinearServiceContract, type LinearServiceClientContext, type LinearServiceInputs,
	type LinearServiceOutputs,
} from './LinearServiceContract';
import type { ILinearService } from './ILinearService';
import type { LinearServiceClient } from './client';
import { issue, pageInfo } from './linear.fixture';
import { LinearOperations } from './operations';

describe('Linear oRPC contract', () => {
	test('derives all client keys and DTOs without repeating the adapter interface', () => {
		expectTypeOf<ILinearServiceContract>().toEqualTypeOf<ContractRouterClient<typeof LinearServiceContract, LinearServiceClientContext>>();
		expectTypeOf<LinearServiceClient>().toEqualTypeOf<ILinearServiceContract>();
		expectTypeOf<keyof ILinearServiceContract>().toEqualTypeOf<keyof typeof LinearServiceContract>();
		expectTypeOf<keyof typeof LinearOperations>().toEqualTypeOf<keyof typeof LinearServiceContract>();
		expectTypeOf<Parameters<ILinearService['listIssue']>[0]>().toEqualTypeOf<LinearServiceInputs['listIssue']>();
		expectTypeOf<Awaited<ReturnType<ILinearService['listIssue']>>>().toEqualTypeOf<LinearServiceOutputs['listIssue']>();
		expectTypeOf<LinearServiceOutputs['getIssue']['identifier']>().toEqualTypeOf<string>();
		expectTypeOf<LinearServiceOutputs['listIssue']['pageInfo']['hasNextPage']>().toEqualTypeOf<boolean>();
	});

	test('keeps public export identity and compatibility schema/tool exports', () => {
		expect(publicContract).toBe(LinearServiceContract);
		expect(publicTools).toBe(LinearTools);
		for (const name of Object.keys(LinearServiceContract) as (keyof typeof LinearServiceContract)[]) {
			expect(LinearServiceContract[name]['~orpc'].inputSchema).toBe(LinearMethodInputs[name]);
			expect(LinearServiceContract[name]['~orpc'].outputSchema).toBe(LinearMethodOutputs[name]);
			expect(LinearOperations[name].tool).toEqual(LinearTools[name]);
			expect(LinearStaticServiceContract.methods[name]).toEqual({
				description: LinearTools[name].description,
				inputSchema: LinearTools[name].inputSchema,
				outputSchema: LinearTools[name].outputSchema,
			});
		}
	});

	test('defaults empty viewer and optional lists without making identifiers optional', () => {
		expect(LinearMethodInputs.getViewer.parse(undefined)).toEqual({});
		for (const name of ['listTeam', 'listUser', 'listProject', 'listIssue'] as const) {
			expect(LinearMethodInputs[name].parse(undefined)).toEqual({ first: 50, includeArchived: false });
			expect(LinearMethodInputs[name].parse({ after: 'cursor' })).toEqual({ first: 50, includeArchived: false, after: 'cursor' });
		}
		for (const name of ['listIssueState', 'listComment', 'getIssue', 'createIssue', 'updateIssue', 'createComment'] as const) {
			expect(LinearMethodInputs[name].safeParse(undefined).success).toBe(false);
			expect(LinearMethodInputs[name].safeParse({}).success).toBe(false);
		}
	});

	test('exports AJV-compatible schemas with defaulted pagination optional on input', () => {
		const ajv = new Ajv2020({ strict: false, validateFormats: false });
		for (const procedure of Object.values(LinearServiceContract)) {
			expect(procedure['~orpc'].meta.description).toBeTruthy();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].inputSchema!))).not.toThrow();
			expect(() => ajv.compile(toJsonSchema(procedure['~orpc'].outputSchema!))).not.toThrow();
			expect(toJsonSchema(procedure['~orpc'].outputSchema!).type).toBe('object');
		}
		for (const name of ['getViewer', 'listTeam', 'listUser', 'listProject', 'listIssue'] as const) {
			expect(ajv.compile(LinearTools[name].inputSchema)({})).toBe(true);
		}
		expect(ajv.compile(LinearTools.listIssueState.inputSchema)({ teamId: 't' })).toBe(true);
		expect(ajv.compile(LinearTools.listComment.inputSchema)({ issueId: 'LIN-1' })).toBe(true);
		expect(ajv.compile(LinearTools.listIssueState.inputSchema)({})).toBe(false);
		expect(ajv.compile(LinearTools.listIssue.inputSchema)({ first: 101 })).toBe(false);
		for (const bad of [{ after: null }, { query: null }, { filter: null }]) {
			expect(ajv.compile(LinearTools.listIssue.inputSchema)(bad)).toBe(false);
		}
		expect(ajv.compile(LinearTools.listIssue.inputSchema)({ filter: { and: [{ priority: { gt: 0 } }], archivedAt: null } })).toBe(true);
		expect(ajv.compile(LinearTools.updateIssue.inputSchema)({ id: 'LIN-1' })).toBe(false);
		expect(ajv.compile(LinearTools.updateIssue.inputSchema)({ id: 'LIN-1', assigneeId: null })).toBe(true);
		expect(ajv.compile(LinearTools.updateIssue.inputSchema)({ id: 'LIN-1', title: null })).toBe(false);
	});

	test('validates DTO fields and connection envelopes while preserving GraphQL extensions', () => {
		const value = {
			nodes: [{ ...issue(), customField: { value: 1 }, team: { ...issue().team, timezone: 'UTC' } }],
			pageInfo: { ...pageInfo, hasNextPage: true, endCursor: 'next', hasPreviousPage: false, startCursor: 'start' },
			totalCount: 2,
		};
		expect(LinearMethodOutputs.listIssue.parse(value)).toEqual(value);
		const validate = new Ajv2020({ strict: false }).compile(LinearTools.listIssue.outputSchema!);
		expect(validate(value)).toBe(true);
		for (const bad of [{ nodes: value.nodes }, { ...value, pageInfo: {} }, { ...value, nodes: [{ ...issue(), priority: 'high' }] }]) {
			expect(LinearMethodOutputs.listIssue.safeParse(bad).success).toBe(false);
			expect(validate(bad)).toBe(false);
		}
	});

	test('marks exactly three writes and keeps update destructive', () => {
		expect([...LinearWriteOperations]).toEqual(['createIssue', 'updateIssue', 'createComment']);
		for (const name of Object.keys(LinearServiceContract) as (keyof typeof LinearServiceContract)[]) {
			expect(LinearOperations[name].tool.annotations?.readOnlyHint).toBe(!LinearWriteOperations.has(name));
		}
		expect(LinearTools.updateIssue.annotations?.destructiveHint).toBe(true);
	});
});
