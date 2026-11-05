import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { z } from 'zod';
import { normalizeCliServices } from '../config';
import { SqlServiceProvider } from './SqlServiceProvider';
import { createServiceProviderAdapter } from '../runtime/createServiceProviderAdapter';
import { createServiceRuntime } from '../runtime/createServiceRuntime';
import { ServiceProviderRegistry } from '../runtime/ServiceProviderRegistry';
import { SqlToolInputs, SqlTools } from '../runtime/sql-tools';
import { SqlMethodInputs, SqlMethodOutputs, SqlServiceContract } from './SqlServiceContract';
import type { SQLExecutionResult, SQLObject, SQLObjectDescription, SQLPingResult } from './types';

describe('SQL service contract', () => {
	it('registers the five existing operations with shared input, output and description metadata', () => {
		expect(SqlServiceProvider.contract).toBe(SqlServiceContract);
		expect(Object.keys(SqlServiceContract.methods)).toEqual(['ping', 'query', 'exec', 'listObject', 'describeObject']);
		expect(SqlToolInputs).toBe(SqlMethodInputs);
		for (const [name, method] of Object.entries(SqlServiceContract.methods)) {
			expect(method.inputType).toBeTruthy();
			expect(method.outputType).toBeTruthy();
			expect(method.outputType).not.toBe('unknown');
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
			type: 'object', required: ['columns', 'rows', 'durationMs'],
			properties: { affectedRows: { type: ['number', 'string'] } },
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

	it('generates standalone TypeScript expressions for all five inputs and outputs', async () => {
		const declarations = Object.entries(SqlServiceContract.methods).flatMap(([name, method]) => [
			`export type ${name}Input = ${method.inputType};`,
			`export type ${name}Output = ${method.outputType};`,
		]);
		const source = `${declarations.join('\n')}
export interface SqlService {
${Object.entries(SqlServiceContract.methods).map(([name]) => `${name}(input: ${name}Input): Promise<${name}Output>;`).join('\n')}
}
declare const service: SqlService;
async function consume() {
	const ping = await service.ping({});
	const ok: boolean = ping.ok;
	const query = await service.query({ statement: 'SELECT 1', params: [1], limit: 1 });
	const columns: string[] = query.columns;
	const rows: Record<string, unknown>[] = query.rows;
	const duration: number = query.durationMs;
	const affected: number | string | undefined = query.affectedRows;
	// @ts-expect-error affectedRows preserves string precision and cannot be assumed to be numeric
	const affectedNumber: number = query.affectedRows;
	const exec: queryOutput = await service.exec({ statement: 'DELETE FROM sample' });
	const objects = await service.listObject({ parent: { schema: 'public' }, search: 'sample' });
	const name: string = objects[0].name;
	const type: string = objects[0].type;
	const description = await service.describeObject({ object: { name: 'sample' } });
	const descriptionDuration: number | undefined = description.durationMs;
	const childName: string | undefined = description.children?.[0].name;
	const attributes: Record<string, unknown> | undefined = description.attributes;
	// @ts-expect-error describing an object requires its name
	await service.describeObject({ object: { schema: 'public' } });
}
`;
		const directory = await mkdtemp(join(tmpdir(), 'sql-contract-'));
		try {
			const filename = join(directory, 'contract.ts');
			await writeFile(filename, source);
			const compiler = fileURLToPath(new URL('../../../../../node_modules/typescript/bin/tsc', import.meta.url));
			const result = await promisify(execFile)(process.execPath, [
				compiler, '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck', '--target', 'es2022', filename,
			], { timeout: 30000 }).catch((error: { stdout?: string; stderr?: string }) => {
				throw new Error(`${error.stdout ?? ''}${error.stderr ?? ''}`);
			});
			expect(result.stdout).toBe('');
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	}, 30000);
});
