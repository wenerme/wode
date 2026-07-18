import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { listCustomers } from './console-demo-database';
import { type ConsoleDemoDataRuntime, createConsoleDemoDataRuntime } from './console-demo-react-db';

const databases = new Set<string>();
const runtimes = new Set<ConsoleDemoDataRuntime>();

afterEach(async () => {
	for (const runtime of runtimes) await runtime.dispose();
	runtimes.clear();
	for (const name of databases) await Dexie.delete(name);
	databases.clear();
});

describe('ConsoleDemoDataRuntime', () => {
	it('confirms optimistic inserts through the Dexie source', async () => {
		const runtime = await createRuntime();
		await runtime.customers.preload();
		const record = {
			id: 'customer-runtime',
			name: 'Runtime 客户',
			owner: 'Wener',
			status: 'active' as const,
			updatedAt: '2026-07-18T03:00:00.000Z',
		};
		const transaction = runtime.customers.insert(record);
		await transaction.isPersisted.promise;
		expect(runtime.customers.get(record.id)).toMatchObject(record);
		expect((await listCustomers(runtime.database, 'automation')).map((item) => item.id)).toContain(record.id);
	});

	it('rolls back an optimistic insert when Dexie persistence fails', async () => {
		const runtime = await createRuntime();
		await runtime.customers.preload();
		runtime.database.close();
		const transaction = runtime.customers.insert({
			id: 'customer-rollback',
			name: 'Rollback 客户',
			owner: 'Wener',
			status: 'prospect',
			updatedAt: '2026-07-18T03:10:00.000Z',
		});
		await expect(transaction.isPersisted.promise).rejects.toThrow();
		expect(runtime.customers.has('customer-rollback')).toBe(false);
	});
});

async function createRuntime() {
	const databaseName = `console-demo-runtime-test-${crypto.randomUUID()}`;
	databases.add(databaseName);
	const runtime = await createConsoleDemoDataRuntime({ databaseName, partition: 'automation', reset: true });
	runtimes.add(runtime);
	return runtime;
}
