import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createBuiltinServiceProviders } from '@wener/common/service/builtin';
import { normalizeCliServices } from '@wener/common/service/config';
import { createServiceRuntime, ServiceProviderRegistry } from '@wener/common/service/runtime';
import type { SQLObjectDescription } from '@wener/common/service/sql';
import Ajv2020 from 'ajv/dist/2020.js';
import { expect, it } from 'vitest';
import { createNativeSqlDriver } from './native/sql';

it('validates real SQLite results for all five operations against published output schemas', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'sql-contract-sqlite-'));
	const runtime = createServiceRuntime({
		context: { services: normalizeCliServices([{
			name: 'db', type: 'sql', readOnly: false,
			options: { dialect: 'sqlite', filename: join(directory, 'fixture.sqlite') },
		}]) },
		providers: new ServiceProviderRegistry(createBuiltinServiceProviders()),
		sqlDriver: createNativeSqlDriver,
	});
	try {
		const { tools } = await runtime.getSchema({ params: { service: 'db' } });
		const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, removeAdditional: false });
		const operations = [
			['exec', { statement: 'CREATE TABLE sample (id INTEGER PRIMARY KEY, value TEXT NOT NULL)' }],
			['exec', { statement: 'INSERT INTO sample (value) VALUES (?)', params: ['fixture'] }],
			['ping', {}],
			['query', { statement: 'SELECT id, value FROM sample' }],
			['listObject', {}],
			['describeObject', { object: { name: 'sample' } }],
		] as const;
		for (const [toolName, input] of operations) {
			const result = await runtime.call({ params: { service: 'db' }, body: { toolName, input } });
			const validate = ajv.compile(tools[toolName].outputSchema!);
			const before = structuredClone(result);
			expect(validate(result), `${toolName}: ${ajv.errorsText(validate.errors)}`).toBe(true);
			expect(result).toEqual(before);
			if (toolName === 'describeObject') {
				const description = result as SQLObjectDescription;
				expect(description).toMatchObject({ object: { name: 'sample' }, children: [{ name: 'id' }, { name: 'value' }] });
				expect(typeof description.durationMs).toBe('number');
				expect(description.durationMs).toBeGreaterThanOrEqual(0);
				expect(validate({ ...description, durationMs: -1 })).toBe(false);
				expect(validate.errors).toContainEqual(expect.objectContaining({ keyword: 'minimum', instancePath: '/durationMs' }));
				expect(validate({ ...description, unexpected: true })).toBe(false);
				expect(validate.errors).toContainEqual(expect.objectContaining({ keyword: 'additionalProperties' }));
				const { durationMs: _durationMs, ...withoutDuration } = description;
				expect(validate(withoutDuration)).toBe(true);
			}
		}
	} finally {
		try { await runtime.close(); }
		finally { await rm(directory, { recursive: true, force: true }); }
	}
});
