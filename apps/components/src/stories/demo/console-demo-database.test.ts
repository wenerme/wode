import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
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
import { CONSOLE_DEMO_COUNTS, consoleDemoDataset } from './console-demo-dataset';
import {
	type ContactRecord,
	ContactRecordSchema,
	type CustomerRecord,
	CustomerRecordSchema,
} from './console-demo-resource-schema';

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
				...(consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]),
				id: 'customer-persisted',
				name: '星河数据',
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
		await database.open();
		await putCustomers(database, 'manual', [
			{
				...(consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]),
				id: 'customer-manual-only',
				name: '手动客户',
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
				...(consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]),
				id: 'customer-cascade',
				name: '级联客户',
				status: 'active',
				updatedAt: '2026-07-18T02:20:00.000Z',
			},
		]);
		await putContacts(database, 'automation', [
			{
				...(consoleDemoDataset.contacts[0] as (typeof consoleDemoDataset.contacts)[number]),
				id: 'contact-cascade',
				customerId: 'customer-cascade',
				tenantId: (consoleDemoDataset.customers[0] as (typeof consoleDemoDataset.customers)[number]).tenantId,
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

	it('resets both partitions to the complete deterministic baseline', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		await prepareConsoleDemoDatabase(database, 'automation', { reset: true });
		expect(await listCustomers(database, 'automation')).toHaveLength(CONSOLE_DEMO_COUNTS.customers);
		expect(await listContacts(database, 'automation')).toHaveLength(CONSOLE_DEMO_COUNTS.contacts);
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

	it('migrates a v1 manual partition without deleting custom records', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		const legacyCustomerId = '123e4567-e89b-12d3-a456-426614174000';
		const legacyContactId = '223e4567-e89b-12d3-a456-426614174000';
		await database.open();
		await database.customers.put({
			storageKey: `manual:${legacyCustomerId}`,
			partition: 'manual',
			id: legacyCustomerId,
			name: '甲',
			owner: '旧负责人',
			status: 'active',
			updatedAt: '2026-07-18T02:30:00.000Z',
		} as never);
		await database.contacts.put({
			storageKey: `manual:${legacyContactId}`,
			partition: 'manual',
			id: legacyContactId,
			customerId: legacyCustomerId,
			name: '乙',
			role: '主',
			email: 'legacy@example.com',
			phone: '+86 21 5555 0000',
			updatedAt: '2026-07-18T02:31:00.000Z',
		} as never);
		await database.metadata.put({ key: 'seeded', partition: 'manual', storageKey: 'manual:seeded', value: 'v1' });

		await prepareConsoleDemoDatabase(database, 'manual');
		const customers = await listCustomers(database, 'manual');
		const contacts = await listContacts(database, 'manual');
		expect(customers).toHaveLength(1);
		expect(contacts).toHaveLength(1);
		expect(customers[0]).toMatchObject({ id: `customer-${legacyCustomerId}`, name: '甲' });
		expect(contacts[0]).toMatchObject({
			id: `contact-${legacyContactId}`,
			customerId: `customer-${legacyCustomerId}`,
			name: '乙',
			phone: '+86 21 5555 0000',
		});
		expect(CustomerRecordSchema.safeParse(customers[0]).success).toBe(true);
		expect(ContactRecordSchema.safeParse(contacts[0]).success).toBe(true);
		database.close();
	});

	it('preserves an intentionally empty v1 manual partition', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		await database.open();
		await database.metadata.put({ key: 'seeded', partition: 'manual', storageKey: 'manual:seeded', value: 'v1' });
		await prepareConsoleDemoDatabase(database, 'manual');
		expect(await listCustomers(database, 'manual')).toHaveLength(0);
		expect(await listContacts(database, 'manual')).toHaveLength(0);
		database.close();
	});

	it('rejects duplicate legacy business IDs without changing either partition table', async () => {
		const duplicateCustomerDatabase = new ConsoleDemoDatabase(createDatabaseName());
		await duplicateCustomerDatabase.open();
		const customerId = '323e4567-e89b-12d3-a456-426614174000';
		await duplicateCustomerDatabase.customers.bulkPut([
			legacyCustomer('manual:legacy-customer-a', customerId, '客户甲'),
			legacyCustomer('manual:legacy-customer-b', customerId, '客户乙'),
		] as never);
		await duplicateCustomerDatabase.metadata.put({
			key: 'seeded',
			partition: 'manual',
			storageKey: 'manual:seeded',
			value: 'v1',
		});
		await expect(prepareConsoleDemoDatabase(duplicateCustomerDatabase, 'manual')).rejects.toThrow(
			'duplicate source customer IDs',
		);
		expect((await duplicateCustomerDatabase.customers.toArray()).map((record) => record.name).sort()).toEqual([
			'客户乙',
			'客户甲',
		]);
		duplicateCustomerDatabase.close();

		const duplicateContactDatabase = new ConsoleDemoDatabase(createDatabaseName());
		await duplicateContactDatabase.open();
		const contactId = '423e4567-e89b-12d3-a456-426614174000';
		await duplicateContactDatabase.customers.put(
			legacyCustomer('manual:legacy-customer', customerId, '客户甲') as never,
		);
		await duplicateContactDatabase.contacts.bulkPut([
			legacyContact('manual:legacy-contact-a', contactId, customerId, '联系人甲'),
			legacyContact('manual:legacy-contact-b', contactId, customerId, '联系人乙'),
		] as never);
		await duplicateContactDatabase.metadata.put({
			key: 'seeded',
			partition: 'manual',
			storageKey: 'manual:seeded',
			value: 'v1',
		});
		await expect(prepareConsoleDemoDatabase(duplicateContactDatabase, 'manual')).rejects.toThrow(
			'duplicate source contact IDs',
		);
		expect((await duplicateContactDatabase.contacts.toArray()).map((record) => record.name).sort()).toEqual([
			'联系人乙',
			'联系人甲',
		]);
		expect((await duplicateContactDatabase.customers.toArray())[0]?.id).toBe(customerId);
		duplicateContactDatabase.close();
	});

	it('rejects distinct legacy IDs that normalize to the same storage identity', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		await database.open();
		await database.customers.bulkPut([
			legacyCustomer('manual:legacy-uppercase', 'ABC', '客户甲'),
			legacyCustomer('manual:legacy-lowercase', 'abc', '客户乙'),
		] as never);
		await database.metadata.put({ key: 'seeded', partition: 'manual', storageKey: 'manual:seeded', value: 'v1' });
		await expect(prepareConsoleDemoDatabase(database, 'manual')).rejects.toThrow('duplicate customer IDs');
		expect((await database.customers.toArray()).map((record) => record.id).sort()).toEqual(['ABC', 'abc']);
		database.close();
	});

	it('rejects records that violate the public Zod schemas before writing', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		await prepareConsoleDemoDatabase(database, 'automation', { reset: true });
		const invalidCustomer = {
			...(consoleDemoDataset.customers[0] as CustomerRecord),
			id: 'customer-invalid',
			name: '',
		};
		const invalidContact = {
			...(consoleDemoDataset.contacts[0] as ContactRecord),
			id: 'contact-invalid',
			phone: '',
		};
		const ownerMismatch = {
			...(consoleDemoDataset.customers[0] as CustomerRecord),
			id: 'customer-owner-mismatch',
			owner: '不一致负责人',
		};
		const tenantMismatch = {
			...(consoleDemoDataset.contacts[0] as ContactRecord),
			id: 'contact-tenant-mismatch',
			tenantId: (consoleDemoDataset.customers[1] as CustomerRecord).tenantId,
		};
		await expect(putCustomers(database, 'automation', [invalidCustomer])).rejects.toThrow();
		await expect(putContacts(database, 'automation', [invalidContact])).rejects.toThrow();
		await expect(putCustomers(database, 'automation', [ownerMismatch])).rejects.toThrow('owner name mismatch');
		await expect(putContacts(database, 'automation', [tenantMismatch])).rejects.toThrow('tenant mismatch');
		expect((await listCustomers(database, 'automation')).some((record) => record.id === 'customer-invalid')).toBe(
			false,
		);
		expect((await listContacts(database, 'automation')).some((record) => record.id === 'contact-invalid')).toBe(false);
		database.close();
	});

	it('rejects moving a customer across tenants while contacts still reference it', async () => {
		const database = new ConsoleDemoDatabase(createDatabaseName());
		await prepareConsoleDemoDatabase(database, 'automation', { reset: true });
		const customer = consoleDemoDataset.customers[0] as CustomerRecord;
		const targetOwner = consoleDemoDataset.customers[1] as CustomerRecord;
		await expect(
			putCustomers(database, 'automation', [
				{
					...customer,
					tenantId: targetOwner.tenantId,
					ownerUserId: targetOwner.ownerUserId,
					owner: targetOwner.owner,
				},
			]),
		).rejects.toThrow('tenant has related contacts');
		expect((await listCustomers(database, 'automation')).find((record) => record.id === customer.id)?.tenantId).toBe(
			customer.tenantId,
		);
		database.close();
	});
});

function createDatabaseName() {
	const name = `console-demo-test-${crypto.randomUUID()}`;
	databases.add(name);
	return name;
}

function legacyCustomer(storageKey: string, id: string, name: string) {
	return {
		storageKey,
		partition: 'manual',
		id,
		name,
		owner: '旧负责人',
		status: 'active',
		updatedAt: '2026-07-18T02:30:00.000Z',
	};
}

function legacyContact(storageKey: string, id: string, customerId: string, name: string) {
	return {
		storageKey,
		partition: 'manual',
		id,
		customerId,
		name,
		role: '主',
		email: `${storageKey.split(':').at(-1)}@example.com`,
		phone: '+86 21 5555 0000',
		updatedAt: '2026-07-18T02:31:00.000Z',
	};
}
