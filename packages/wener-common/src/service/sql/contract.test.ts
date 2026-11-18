import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { z } from 'zod';
import type { ContractRouterClient } from '@orpc/contract';
import Ajv2020 from 'ajv/dist/2020.js';
import { toJsonSchema } from '../../schema';
import { normalizeCliServices } from '../config';
import { SqlServiceProvider } from './SqlServiceProvider';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { SqlToolInputs as LegacySqlToolInputs, SqlTools as LegacySqlTools } from '../runtime/sql-tools';
import { SqlToolInputs, SqlTools } from './tools';
import { SqlMethodInputs, SqlMethodOutputs, SqlServiceContract as SqlRouter, SqlStaticServiceContract as SqlServiceContract,
	SqlContract, type ISqlServiceContract, type SqlServiceClientContext, type SqlServiceInputs, type SqlServiceOutputs } from './SqlServiceContract';
import type { ISqlService } from './ISqlService';
import type { SQLQueryInput, SQLExecInput, SQLListObjectInput, SQLObjectReference, SQLDescribeObjectInput, SQLExecutionResult, SQLObject, SQLObjectDescription, SQLPingResult } from './types';

describe('SQL service contract', () => {
	it('keeps the old SQL tools entry point as an identity shim usable by existing consumers', () => {
		expect(LegacySqlToolInputs).toBe(SqlToolInputs);
		expect(LegacySqlTools).toBe(SqlTools);
		expectTypeOf<typeof LegacySqlToolInputs>().toEqualTypeOf<typeof SqlToolInputs>();
		expectTypeOf<typeof LegacySqlTools>().toEqualTypeOf<typeof SqlTools>();
		expect(LegacySqlToolInputs.ping.parse(undefined)).toEqual({});
		const query = LegacySqlToolInputs.query.parse({ statement: 'SELECT $1', params: [1], limit: 1 });
		const validate = new Ajv2020({ strict: false }).compile(LegacySqlTools.query.inputSchema);
		expect(validate(query)).toBe(true);
		expect(validate({ statement: 'SELECT 1', limit: 0 })).toBe(false);
	});

	it('derives the native client and service from exactly the five procedure keys', () => {
		expectTypeOf<ISqlServiceContract>().toEqualTypeOf<ContractRouterClient<typeof SqlRouter, SqlServiceClientContext>>();
		expectTypeOf<keyof ISqlServiceContract>().toEqualTypeOf<keyof typeof SqlRouter>();
		expectTypeOf<Parameters<ISqlService['query']>[0]>().toEqualTypeOf<SqlServiceInputs['query']>();
		expectTypeOf<Awaited<ReturnType<ISqlService['query']>>>().toEqualTypeOf<SqlServiceOutputs['query']>();
		expectTypeOf<SQLQueryInput>().toEqualTypeOf<SqlServiceInputs['query']>();
		expectTypeOf<SQLQueryInput['params']>().toEqualTypeOf<readonly unknown[] | undefined>();
		expectTypeOf<SQLExecInput>().toEqualTypeOf<SqlServiceInputs['exec']>();
		expectTypeOf<SQLListObjectInput>().toEqualTypeOf<NonNullable<SqlServiceInputs['listObject']>>();
		expectTypeOf<SQLObjectReference>().toEqualTypeOf<NonNullable<SQLListObjectInput['parent']>>();
		expectTypeOf<SQLDescribeObjectInput>().toEqualTypeOf<SqlServiceInputs['describeObject']>();
		expectTypeOf<SQLObject>().toEqualTypeOf<SqlServiceOutputs['listObject'][number]>();
		expect(Object.keys(SqlRouter)).toEqual(Object.keys(SqlServiceContract.methods));
		expect(SqlContract).toBe(SqlServiceContract);
		expect(SqlRouter.ping['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(SqlRouter.listObject['~orpc'].inputSchema!.parse(undefined)).toEqual({});
		expect(SqlRouter.query['~orpc'].inputSchema!.safeParse(undefined).success).toBe(false);
	});

	it('compiles contract schemas with AJV and retains SQL write annotations', () => {
		const ajv = new Ajv2020({ strict: false });
		for (const [name, procedure] of Object.entries(SqlRouter)) {
			expect(procedure['~orpc'].meta).toMatchObject({ readOnlyHint: name !== 'exec', destructiveHint: name === 'exec' });
			for (const schema of [procedure['~orpc'].inputSchema!, procedure['~orpc'].outputSchema!])
				expect(() => ajv.compile(toJsonSchema(schema))).not.toThrow();
		}
		const validate = ajv.compile(toJsonSchema(SqlRouter.query['~orpc'].inputSchema!));
		expect(validate({ statement: 'SELECT $1', params: [{ nested: true }], limit: 1 })).toBe(true);
		expect(validate({ statement: 'SELECT 1', limit: 0 })).toBe(false);
		expect(validate({ statement: 'SELECT 1', connection: 'private' })).toBe(false);
	});
	it('registers the five existing operations with shared input, output and description metadata', () => {
		expect(SqlServiceProvider.contract).toBe(SqlServiceContract);
		expect(Object.keys(SqlServiceContract.methods)).toEqual(['ping', 'query', 'exec', 'listObject', 'describeObject']);
		expect(SqlToolInputs).toBe(SqlMethodInputs);
		for (const [name, method] of Object.entries(SqlServiceContract.methods)) {
			const procedure = SqlRouter[name as keyof typeof SqlRouter]['~orpc'];
			expect(method).not.toHaveProperty('inputType');
			expect(method).not.toHaveProperty('outputType');
			expect(method.description).toBe(procedure.meta.description);
			expect(method.inputSchema).toBe(toJsonSchema(procedure.inputSchema!));
			expect(method.outputSchema).toBe(toJsonSchema(procedure.outputSchema!));
			expect(SqlTools[name]).toEqual({
				description: method.description,
				inputSchema: method.inputSchema,
				outputSchema: method.outputSchema,
				annotations: { readOnlyHint: name !== 'exec', destructiveHint: name === 'exec' },
			});
		}
	});

	it('keeps target output fields and both affected-row representations without losing precision', () => {
		expectTypeOf<z.output<typeof SqlMethodOutputs.ping>>().toEqualTypeOf<SQLPingResult>();
		expectTypeOf<z.output<typeof SqlMethodOutputs.query>>().toEqualTypeOf<SQLExecutionResult>();
		expectTypeOf<z.output<typeof SqlMethodOutputs.exec>>().toEqualTypeOf<SQLExecutionResult>();
		expectTypeOf<z.output<typeof SqlMethodOutputs.listObject>>().toEqualTypeOf<SQLObject[]>();
		expectTypeOf<z.output<typeof SqlMethodOutputs.describeObject>>().toEqualTypeOf<SQLObjectDescription>();
		for (const affectedRows of [0, 42, '900719925474099312345']) {
			const result = {
				columns: ['id'], rows: [{ id: '900719925474099312345', nested: { value: null } }],
				durationMs: 1, affectedRows, lastInsertId: '900719925474099312345', warnings: ['fixture'],
			};
			for (const output of [SqlMethodOutputs.query, SqlMethodOutputs.exec]) {
				expect(output.parse(result)).toEqual(result);
				expect(JSON.parse(JSON.stringify(output.parse(result)))).toEqual(result);
			}
		}
		expect(SqlServiceContract.methods.query.outputSchema).toMatchObject({
			type: 'object', required: ['columns', 'durationMs', 'rows'],
			properties: { affectedRows: { type: expect.arrayContaining(['number', 'string']) } },
		});
		expect(SqlServiceContract.methods.listObject.outputSchema).toMatchObject({ type: 'array' });
		expect(SqlServiceContract.methods.describeObject.outputSchema).toMatchObject({
			type: 'object', required: ['object'], properties: {
				children: { type: 'array' }, attributes: { type: 'object' }, durationMs: { type: 'number', minimum: 0 },
			},
		});
	});

	it('publishes outputs through generic schema discovery without driver, secret or network access', async () => {
		const sqlDriver = vi.fn(() => { throw new Error('Driver must remain lazy'); });
		const getEnv = vi.fn(() => { throw new Error('Secrets must remain unresolved'); });
		const fetch = vi.fn<typeof globalThis.fetch>(() => { throw new Error('Network must remain idle'); });
		const runtime = createServiceRuntime({
			context: { services: normalizeCliServices([{ name: 'db', type: 'sql', baseUrl: 'env://SQL_URL' }]) },
			providers: new ServiceProviderRegistry([createServiceProviderAdapter(SqlServiceProvider)]),
			sqlDriver, getEnv, fetch,
		});
		try {
			const schema = await runtime.getSchema({ params: { service: 'db' } });
			expect(Object.keys(schema.tools)).toEqual(Object.keys(SqlServiceContract.methods));
			for (const [name, tool] of Object.entries(schema.tools)) {
				expect(tool.outputSchema).toEqual(SqlServiceContract.methods[name].outputSchema);
				expect(tool.outputSchema).toBeDefined();
			}
			expect(sqlDriver).not.toHaveBeenCalled();
			expect(getEnv).not.toHaveBeenCalled();
			expect(fetch).not.toHaveBeenCalled();
		} finally {
			await runtime.close();
		}
	});

});
