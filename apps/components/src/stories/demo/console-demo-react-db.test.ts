import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { ConsoleDemoDatabase, listContacts, listCustomers } from './console-demo-database';
import { consoleDemoDataset } from './console-demo-dataset';
import {
	type ConsoleDemoDataRuntime,
	type CreateConsoleDemoDataRuntimeOptions,
	createConsoleDemoDataRuntime,
} from './console-demo-react-db';

const databases = new Set<string>();
const runtimes = new Set<ConsoleDemoDataRuntime>();

afterEach(async () => {
	for (const runtime of runtimes) await runtime.dispose();
	runtimes.clear();
	for (const name of databases) await Dexie.delete(name);
	databases.clear();
});

describe('ConsoleDemoDataRuntime', () => {
	it('exposes seeded collections when runtime creation resolves', async () => {
		const runtime = await createRuntime();
		expect(runtime.customers.size).toBe(consoleDemoDataset.customers.length);
		expect(runtime.contacts.size).toBe(consoleDemoDataset.contacts.length);
	});

	it('confirms optimistic inserts through the Dexie source', async () => {
		const runtime = await createRuntime();
		await runtime.customers.preload();
		const record = {
			...(consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]),
			id: 'customer-runtime',
			name: 'Runtime 客户',
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
			...(consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]),
			id: 'customer-rollback',
			name: 'Rollback 客户',
			status: 'prospect',
			updatedAt: '2026-07-18T03:10:00.000Z',
		});
		await expect(transaction.isPersisted.promise).rejects.toThrow();
		expect(runtime.customers.has('customer-rollback')).toBe(false);
	});

	it('rolls back optimistic updates when Dexie persistence fails', async () => {
		const runtime = await createRuntime();
		await runtime.customers.preload();
		const record = consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number];
		const originalName = runtime.customers.get(record.id)?.name;
		runtime.database.close();
		const transaction = runtime.customers.update(record.id, (draft) => {
			draft.name = '不应保留的名称';
		});
		await expect(transaction.isPersisted.promise).rejects.toThrow();
		expect(runtime.customers.get(record.id)?.name).toBe(originalName);
	});

	it('rolls back customer and related contact collections when a delete fails', async () => {
		const runtime = await createRuntime();
		await Promise.all([runtime.customers.preload(), runtime.contacts.preload()]);
		const customer = consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number];
		const contact = consoleDemoDataset.contacts.find((record) => record.customerId === customer.id);
		expect(contact).toBeDefined();
		runtime.database.close();
		const transaction = runtime.customers.delete(customer.id);
		await expect(transaction.isPersisted.promise).rejects.toThrow();
		expect(runtime.customers.has(customer.id)).toBe(true);
		expect(runtime.contacts.has((contact as (typeof consoleDemoDataset.contacts)[number]).id)).toBe(true);
	});

	it('keeps a durable insert committed when the post-persist refresh fails', async () => {
		let failRefresh = false;
		const syncErrors: unknown[] = [];
		const runtime = await createRuntime({
			onSyncError: (error) => syncErrors.push(error),
			readCustomers: async (database, partition) => {
				if (failRefresh) throw new Error('refresh unavailable');
				return listCustomers(database, partition);
			},
		});
		await runtime.customers.preload();
		const record = {
			...(consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]),
			id: 'customer-durable-refresh-failure',
			name: '已持久化客户',
		};
		failRefresh = true;
		const transaction = runtime.customers.insert(record);
		await transaction.isPersisted.promise;
		expect(runtime.customers.get(record.id)).toMatchObject(record);
		expect((await listCustomers(runtime.database, 'automation')).some((item) => item.id === record.id)).toBe(true);
		expect(syncErrors.some((error) => error instanceof Error && error.message === 'refresh unavailable')).toBe(true);
	});

	it('keeps a durable customer cascade committed when contact refresh fails', async () => {
		let failContactRefresh = false;
		const syncErrors: unknown[] = [];
		const runtime = await createRuntime({
			onSyncError: (error) => syncErrors.push(error),
			readContacts: async (database, partition) => {
				if (failContactRefresh) throw new Error('contact refresh unavailable');
				return listContacts(database, partition);
			},
		});
		await Promise.all([runtime.customers.preload(), runtime.contacts.preload()]);
		const customer = consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number];
		failContactRefresh = true;
		await runtime.customers.delete(customer.id).isPersisted.promise;
		expect(runtime.customers.has(customer.id)).toBe(false);
		expect((await listCustomers(runtime.database, 'automation')).some((record) => record.id === customer.id)).toBe(
			false,
		);
		expect(
			(await listContacts(runtime.database, 'automation')).some((record) => record.customerId === customer.id),
		).toBe(false);
		expect(syncErrors.some((error) => error instanceof Error && error.message === 'contact refresh unavailable')).toBe(
			true,
		);
	});

	it('keeps a replacement runtime alive while its predecessor disposes', async () => {
		const databaseName = `console-demo-runtime-test-${crypto.randomUUID()}`;
		databases.add(databaseName);
		const predecessor = await createConsoleDemoDataRuntime({
			databaseName,
			partition: 'automation',
			reset: true,
			runtimeId: 'predecessor',
		});
		const replacement = await createConsoleDemoDataRuntime({
			databaseName,
			partition: 'automation',
			runtimeId: 'replacement',
		});
		runtimes.add(predecessor);
		runtimes.add(replacement);
		await Promise.all([predecessor.customers.preload(), replacement.customers.preload()]);
		await predecessor.dispose();
		runtimes.delete(predecessor);

		const record = {
			...(consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]),
			id: 'customer-replacement-runtime',
			name: 'Replacement Runtime 客户',
		};
		await replacement.customers.insert(record).isPersisted.promise;
		expect(replacement.customers.get(record.id)).toMatchObject(record);
		expect((await listCustomers(replacement.database, 'automation')).map((item) => item.id)).toContain(record.id);
	});

	it('cleans up a failed initial sync before the same database retries', async () => {
		const databaseName = `console-demo-runtime-test-${crypto.randomUUID()}`;
		const syncErrors: unknown[] = [];
		databases.add(databaseName);
		await expect(
			createConsoleDemoDataRuntime({
				databaseName,
				onSyncError: (error) => syncErrors.push(error),
				partition: 'automation',
				readCustomers: async () => {
					throw new Error('initial customer sync unavailable');
				},
				reset: true,
				runtimeId: 'failed-initial-sync',
			}),
		).rejects.toThrow('initial customer sync unavailable');
		expect(syncErrors.some((error) => error instanceof Error && error.message.includes('initial customer sync'))).toBe(
			true,
		);
		expect(getDexieConnections().some((connection) => connection.name === databaseName)).toBe(false);

		const replacement = await createConsoleDemoDataRuntime({
			databaseName,
			partition: 'automation',
			runtimeId: 'successful-retry',
		});
		runtimes.add(replacement);
		expect(replacement.customers.size).toBe(consoleDemoDataset.customers.length);
		expect(replacement.contacts.size).toBe(consoleDemoDataset.contacts.length);
	});

	it('closes the Dexie connection when manual migration initialization fails', async () => {
		const databaseName = `console-demo-runtime-test-${crypto.randomUUID()}`;
		databases.add(databaseName);
		const database = new ConsoleDemoDatabase(databaseName);
		await database.open();
		const duplicateId = '523e4567-e89b-12d3-a456-426614174000';
		await database.customers.bulkPut([
			legacyStoredCustomer('manual:duplicate-a', duplicateId, '客户甲'),
			legacyStoredCustomer('manual:duplicate-b', duplicateId, '客户乙'),
		] as never);
		await database.metadata.put({ key: 'seeded', partition: 'manual', storageKey: 'manual:seeded', value: 'v1' });
		database.close();

		await expect(createConsoleDemoDataRuntime({ databaseName, partition: 'manual' })).rejects.toThrow(
			'duplicate source customer IDs',
		);
		expect(getDexieConnections().some((connection) => connection.name === databaseName)).toBe(false);
		await expect(Dexie.delete(databaseName)).resolves.toBeUndefined();
	});
});

async function createRuntime(options: Partial<CreateConsoleDemoDataRuntimeOptions> = {}) {
	const databaseName = `console-demo-runtime-test-${crypto.randomUUID()}`;
	databases.add(databaseName);
	const runtime = await createConsoleDemoDataRuntime({
		databaseName,
		partition: 'automation',
		reset: true,
		...options,
	});
	runtimes.add(runtime);
	return runtime;
}

function legacyStoredCustomer(storageKey: string, id: string, name: string) {
	return {
		storageKey,
		partition: 'manual',
		id,
		name,
		owner: '旧负责人',
		status: 'active',
		updatedAt: '2026-07-18T03:20:00.000Z',
	};
}

function getDexieConnections() {
	return (Dexie as unknown as { connections: readonly Dexie[] }).connections;
}
