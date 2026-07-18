import Dexie, { type EntityTable } from 'dexie';

export const CONSOLE_DEMO_DATABASE_NAME = 'wener-components-console-demo';

export type ConsoleDemoPartition = 'automation' | 'manual';
export type CustomerStatus = 'active' | 'prospect' | 'inactive';

export type CustomerRecord = {
	id: string;
	name: string;
	owner: string;
	status: CustomerStatus;
	updatedAt: string;
};

export type ContactRecord = {
	customerId: string;
	email: string;
	id: string;
	name: string;
	phone: string;
	role: string;
	updatedAt: string;
};

type StoredCustomer = CustomerRecord & { partition: ConsoleDemoPartition; storageKey: string };
type StoredContact = ContactRecord & { partition: ConsoleDemoPartition; storageKey: string };
type StoredMetadata = { key: string; partition: ConsoleDemoPartition; storageKey: string; value: string };

export class ConsoleDemoDatabase extends Dexie {
	customers!: EntityTable<StoredCustomer, 'storageKey'>;
	contacts!: EntityTable<StoredContact, 'storageKey'>;
	metadata!: EntityTable<StoredMetadata, 'storageKey'>;

	constructor(name = CONSOLE_DEMO_DATABASE_NAME) {
		super(name);
		this.version(1).stores({
			customers: 'storageKey, partition, [partition+id], [partition+name], [partition+status], updatedAt',
			contacts: 'storageKey, partition, [partition+id], [partition+customerId], [partition+name], updatedAt',
		});
		this.version(2).stores({
			customers: 'storageKey, partition, [partition+id], [partition+name], [partition+status], updatedAt',
			contacts: 'storageKey, partition, [partition+id], [partition+customerId], [partition+name], updatedAt',
			metadata: 'storageKey, partition, [partition+key]',
		});
	}
}

const seedCustomers: readonly CustomerRecord[] = [
	{ id: 'customer-qiming', name: '启明科技', owner: '林澄', status: 'active', updatedAt: '2026-07-18T01:00:00.000Z' },
	{
		id: 'customer-yuanshan',
		name: '远山制造',
		owner: '周屿',
		status: 'prospect',
		updatedAt: '2026-07-17T09:30:00.000Z',
	},
	{ id: 'customer-hailan', name: '海岚零售', owner: '陈安', status: 'inactive', updatedAt: '2026-07-16T03:20:00.000Z' },
];

const seedContacts: readonly ContactRecord[] = [
	{
		id: 'contact-lincheng',
		customerId: 'customer-qiming',
		name: '林澄',
		role: '采购负责人',
		email: 'lin@example.com',
		phone: '13800000001',
		updatedAt: '2026-07-18T01:05:00.000Z',
	},
	{
		id: 'contact-zhouyu',
		customerId: 'customer-yuanshan',
		name: '周屿',
		role: '技术总监',
		email: 'zhou@example.com',
		phone: '13800000002',
		updatedAt: '2026-07-17T09:35:00.000Z',
	},
	{
		id: 'contact-chenan',
		customerId: 'customer-hailan',
		name: '陈安',
		role: '门店运营',
		email: 'chen@example.com',
		phone: '13800000003',
		updatedAt: '2026-07-16T03:25:00.000Z',
	},
];

export async function prepareConsoleDemoDatabase(
	database: ConsoleDemoDatabase,
	partition: ConsoleDemoPartition,
	options: { reset?: boolean } = {},
) {
	await database.open();
	if (options.reset) {
		await resetConsoleDemoPartition(database, partition);
		return;
	}
	const marker = await database.metadata.get(createStorageKey(partition, 'seeded'));
	if (marker) return;
	const existing =
		(await database.customers.where('partition').equals(partition).count()) +
		(await database.contacts.where('partition').equals(partition).count());
	if (existing > 0) {
		await putSeedMarker(database, partition);
		return;
	}
	await resetConsoleDemoPartition(database, partition);
}

export async function resetConsoleDemoPartition(database: ConsoleDemoDatabase, partition: ConsoleDemoPartition) {
	await database.transaction('rw', database.customers, database.contacts, database.metadata, async () => {
		await Promise.all([
			database.customers.where('partition').equals(partition).delete(),
			database.contacts.where('partition').equals(partition).delete(),
			database.metadata.where('partition').equals(partition).delete(),
		]);
		await database.customers.bulkPut(seedCustomers.map((record) => storeCustomer(partition, record)));
		await database.contacts.bulkPut(seedContacts.map((record) => storeContact(partition, record)));
		await putSeedMarker(database, partition);
	});
}

export async function listCustomers(database: ConsoleDemoDatabase, partition: ConsoleDemoPartition) {
	return (await database.customers.where('partition').equals(partition).toArray()).map(toCustomer);
}

export async function listContacts(database: ConsoleDemoDatabase, partition: ConsoleDemoPartition) {
	return (await database.contacts.where('partition').equals(partition).toArray()).map(toContact);
}

export async function putCustomers(
	database: ConsoleDemoDatabase,
	partition: ConsoleDemoPartition,
	records: readonly CustomerRecord[],
) {
	await database.customers.bulkPut(records.map((record) => storeCustomer(partition, record)));
}

export async function putContacts(
	database: ConsoleDemoDatabase,
	partition: ConsoleDemoPartition,
	records: readonly ContactRecord[],
) {
	await database.contacts.bulkPut(records.map((record) => storeContact(partition, record)));
}

export async function deleteCustomers(
	database: ConsoleDemoDatabase,
	partition: ConsoleDemoPartition,
	ids: readonly string[],
) {
	await database.transaction('rw', database.customers, database.contacts, async () => {
		await database.customers.bulkDelete(ids.map((id) => createStorageKey(partition, id)));
		for (const id of ids) {
			const contacts = await database.contacts.where('[partition+customerId]').equals([partition, id]).primaryKeys();
			await database.contacts.bulkDelete(contacts);
		}
	});
}

export async function deleteContacts(
	database: ConsoleDemoDatabase,
	partition: ConsoleDemoPartition,
	ids: readonly string[],
) {
	await database.contacts.bulkDelete(ids.map((id) => createStorageKey(partition, id)));
}

function createStorageKey(partition: ConsoleDemoPartition, id: string) {
	return `${partition}:${id}`;
}

async function putSeedMarker(database: ConsoleDemoDatabase, partition: ConsoleDemoPartition) {
	await database.metadata.put({
		key: 'seeded',
		partition,
		storageKey: createStorageKey(partition, 'seeded'),
		value: 'v1',
	});
}

function storeCustomer(partition: ConsoleDemoPartition, record: CustomerRecord): StoredCustomer {
	return { ...record, partition, storageKey: createStorageKey(partition, record.id) };
}

function storeContact(partition: ConsoleDemoPartition, record: ContactRecord): StoredContact {
	return { ...record, partition, storageKey: createStorageKey(partition, record.id) };
}

function toCustomer({ partition: _partition, storageKey: _storageKey, ...record }: StoredCustomer): CustomerRecord {
	return record;
}

function toContact({ partition: _partition, storageKey: _storageKey, ...record }: StoredContact): ContactRecord {
	return record;
}
