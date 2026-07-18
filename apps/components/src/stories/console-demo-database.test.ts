import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import {
	ConsoleDemoDatabase,
	deleteCustomers,
	listContacts,
	listCustomers,
	prepareConsoleDemoDatabase,
	putContacts,
	putCustomers,
	resetConsoleDemoPartition,
} from './console-demo-database';

const databases = new Set<string>();

afterEach(async () => {
	for (const name of databases) await Dexie.delete(name);
	databases.clear();
});

describe('ConsoleDemoDatabase', () => {
	it('persists manual records across close and reopen', async () => {
		const name = createDatabaseName();
		let database = new ConsoleDemoDatabase(name);
		await prepareConsoleDemoDatabase(database, 'manual', { reset: true });
		await putCustomers(database, 'manual', [
			{
				id: 'customer-persisted',
				name: '星河数据',
				owner: '韩梅',
				status: 'active',
				updatedAt: '2026-07-18T02:00:00.000Z',
			},
		]);
		database.close();

		database = new ConsoleDemoDatabase(name);
		await prepareConsoleDemoDatabase(database, 'manual');
		expect((await listCustomers(database, 'manual')).map((record) => record.name)).toContain('星河数据');
		database.close();
	});

	it('isolates automation reset from manual data', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		await prepareConsoleDemoDatabase(database, 'manual', { reset: true });
		await prepareConsoleDemoDatabase(database, 'automation', { reset: true });
		await putCustomers(database, 'manual', [
			{
				id: 'customer-manual-only',
				name: '手动客户',
				owner: 'Wener',
				status: 'prospect',
				updatedAt: '2026-07-18T02:10:00.000Z',
			},
		]);
		await resetConsoleDemoPartition(database, 'automation');
		expect((await listCustomers(database, 'manual')).map((record) => record.name)).toContain('手动客户');
		expect((await listCustomers(database, 'automation')).map((record) => record.name)).not.toContain('手动客户');
		database.close();
	});

	it('deletes related contacts in the same customer transaction', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		await prepareConsoleDemoDatabase(database, 'automation', { reset: true });
		await putCustomers(database, 'automation', [
			{
				id: 'customer-cascade',
				name: '级联客户',
				owner: '韩梅',
				status: 'active',
				updatedAt: '2026-07-18T02:20:00.000Z',
			},
		]);
		await putContacts(database, 'automation', [
			{
				id: 'contact-cascade',
				customerId: 'customer-cascade',
				name: '韩梅',
				role: '负责人',
				email: 'cascade@example.com',
				phone: '13800000009',
				updatedAt: '2026-07-18T02:21:00.000Z',
			},
		]);
		await deleteCustomers(database, 'automation', ['customer-cascade']);
		expect((await listContacts(database, 'automation')).map((record) => record.id)).not.toContain('contact-cascade');
		database.close();
	});

	it('does not reseed after the user deletes every customer', async () => {
		const name = createDatabaseName();
		let database = new ConsoleDemoDatabase(name);
		await prepareConsoleDemoDatabase(database, 'manual', { reset: true });
		await deleteCustomers(
			database,
			'manual',
			(await listCustomers(database, 'manual')).map((record) => record.id),
		);
		expect(await listCustomers(database, 'manual')).toHaveLength(0);
		database.close();

		database = new ConsoleDemoDatabase(name);
		await prepareConsoleDemoDatabase(database, 'manual');
		expect(await listCustomers(database, 'manual')).toHaveLength(0);
		database.close();
	});
});

function createDatabaseName() {
	const name = `console-demo-test-${crypto.randomUUID()}`;
	databases.add(name);
	return name;
}
