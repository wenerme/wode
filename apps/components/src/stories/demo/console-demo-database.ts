import Dexie, { type EntityTable } from 'dexie';
import { CONSOLE_DEMO_SEED_VERSION, consoleDemoDataset } from './console-demo-dataset';
import {
	ContactRecordSchema,
	type ContactRecord,
	CustomerRecordSchema,
	type CustomerRecord,
} from './console-demo-resource-schema';

export type { ContactRecord, CustomerRecord, CustomerStatus } from './console-demo-resource-schema';

export const CONSOLE_DEMO_DATABASE_NAME = 'wener-components-console-demo';

export type ConsoleDemoPartition = 'automation' | 'manual';

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
	if (marker?.value === CONSOLE_DEMO_SEED_VERSION) return;
	if (partition === 'manual') {
		const existingCount =
			(await database.customers.where('partition').equals(partition).count()) +
			(await database.contacts.where('partition').equals(partition).count());
		if (!marker && existingCount === 0) await resetConsoleDemoPartition(database, partition);
		else await migrateManualPartition(database);
	} else await resetConsoleDemoPartition(database, partition);
}

export async function resetConsoleDemoPartition(database: ConsoleDemoDatabase, partition: ConsoleDemoPartition) {
	await database.transaction('rw', database.customers, database.contacts, database.metadata, async () => {
		await Promise.all([
			database.customers.where('partition').equals(partition).delete(),
			database.contacts.where('partition').equals(partition).delete(),
			database.metadata.where('partition').equals(partition).delete(),
		]);
		await database.customers.bulkPut(consoleDemoDataset.customers.map((record) => storeCustomer(partition, record)));
		await database.contacts.bulkPut(consoleDemoDataset.contacts.map((record) => storeContact(partition, record)));
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
	const stored = records.map((record) => storeCustomer(partition, record));
	await database.transaction('rw', database.customers, database.contacts, async () => {
		for (const record of stored) {
			const existing = await database.customers.get(record.storageKey);
			if (existing && existing.tenantId !== record.tenantId) {
				const relatedContacts = await database.contacts
					.where('[partition+customerId]')
					.equals([partition, record.id])
					.count();
				if (relatedContacts > 0) throw new Error(`Customer ${record.id} tenant has related contacts`);
			}
		}
		await database.customers.bulkPut(stored);
	});
}

export async function putContacts(
	database: ConsoleDemoDatabase,
	partition: ConsoleDemoPartition,
	records: readonly ContactRecord[],
) {
	const validated = records.map((record) => ContactRecordSchema.parse(record));
	await database.transaction('rw', database.customers, database.contacts, async () => {
		for (const record of validated) {
			const customer = await database.customers.get(createStorageKey(partition, record.customerId));
			if (!customer) throw new Error(`Contact ${record.id} customer is missing`);
			if (customer.tenantId !== record.tenantId) throw new Error(`Contact ${record.id} tenant mismatch`);
		}
		await database.contacts.bulkPut(validated.map((record) => storeContact(partition, record)));
	});
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
		value: CONSOLE_DEMO_SEED_VERSION,
	});
}

function storeCustomer(partition: ConsoleDemoPartition, record: CustomerRecord): StoredCustomer {
	const validated = CustomerRecordSchema.parse(record);
	const owner = consoleDemoDataset.metaUsers.find(
		(user) => user.id === validated.ownerUserId && user.tenantIds.includes(validated.tenantId),
	);
	if (!owner) throw new Error(`Customer ${validated.id} owner tenant mismatch`);
	if (owner.name !== validated.owner) throw new Error(`Customer ${validated.id} owner name mismatch`);
	return { ...validated, partition, storageKey: createStorageKey(partition, validated.id) };
}

function storeContact(partition: ConsoleDemoPartition, record: ContactRecord): StoredContact {
	const validated = ContactRecordSchema.parse(record);
	return { ...validated, partition, storageKey: createStorageKey(partition, validated.id) };
}

function toCustomer({ partition: _partition, storageKey: _storageKey, ...record }: StoredCustomer): CustomerRecord {
	return record;
}

function toContact({ partition: _partition, storageKey: _storageKey, ...record }: StoredContact): ContactRecord {
	return record;
}

async function migrateManualPartition(database: ConsoleDemoDatabase) {
	const partition = 'manual';
	await database.transaction('rw', database.customers, database.contacts, database.metadata, async () => {
		const existingCustomers = await database.customers.where('partition').equals(partition).toArray();
		assertUniqueSourceIds(existingCustomers, 'customer');
		const customerIdMap = new Map(
			existingCustomers.map((record) => [record.id, normalizeLegacyId('customer', record.id)]),
		);
		assertUniqueMappedIds(customerIdMap, 'customer');
		const migratedCustomers = existingCustomers.map((record) =>
			migrateCustomer(toCustomer(record), customerIdMap.get(record.id) as string),
		);
		const customerById = new Map(migratedCustomers.map((record) => [record.id, record]));
		const existingContacts = await database.contacts.where('partition').equals(partition).toArray();
		assertUniqueSourceIds(existingContacts, 'contact');
		const contactIdMap = new Map(
			existingContacts.map((record) => [record.id, normalizeLegacyId('contact', record.id)]),
		);
		assertUniqueMappedIds(contactIdMap, 'contact');
		const migratedContacts = existingContacts.map((record) =>
			migrateContact(
				toContact(record),
				contactIdMap.get(record.id) as string,
				customerIdMap.get(record.customerId) ?? record.customerId,
				customerById,
			),
		);
		await Promise.all([
			database.customers.where('partition').equals(partition).delete(),
			database.contacts.where('partition').equals(partition).delete(),
		]);
		await database.customers.bulkPut(migratedCustomers.map((record) => storeCustomer(partition, record)));
		await database.contacts.bulkPut(migratedContacts.map((record) => storeContact(partition, record)));
		await putSeedMarker(database, partition);
	});
}

function migrateCustomer(record: CustomerRecord, id: string): CustomerRecord {
	const baseline = consoleDemoDataset.customers.find((candidate) => candidate.id === record.id);
	const tenantId = record.tenantId ?? baseline?.tenantId ?? (consoleDemoDataset.tenants[0]?.id as string);
	const owner =
		consoleDemoDataset.metaUsers.find((user) => user.id === record.ownerUserId && user.tenantIds.includes(tenantId)) ??
		consoleDemoDataset.metaUsers.find((user) => user.name === record.owner && user.tenantIds.includes(tenantId)) ??
		consoleDemoDataset.metaUsers.find((user) => user.tenantIds.includes(tenantId));
	if (!owner) throw new Error(`Cannot migrate customer ${record.id}: tenant has no owner`);
	return CustomerRecordSchema.parse({
		...baseline,
		...record,
		id,
		tenantId,
		ownerUserId: owner.id,
		owner: owner.name,
		industry: record.industry ?? baseline?.industry ?? '其他',
	});
}

function migrateContact(
	record: ContactRecord,
	id: string,
	customerId: string,
	customerById: ReadonlyMap<string, CustomerRecord>,
): ContactRecord {
	const baseline = consoleDemoDataset.contacts.find((candidate) => candidate.id === record.id);
	const customer = customerById.get(customerId ?? baseline?.customerId ?? '');
	if (!customer) throw new Error(`Cannot migrate contact ${record.id}: customer is missing`);
	return ContactRecordSchema.parse({
		...baseline,
		...record,
		id,
		customerId: customer.id,
		tenantId: customer.tenantId,
	});
}

function normalizeLegacyId(kind: 'contact' | 'customer', value: string) {
	if (new RegExp(`^${kind}-[a-z0-9-]+$`).test(value)) return value;
	const suffix = value
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '');
	if (!suffix) throw new Error(`Cannot migrate ${kind} ID`);
	return `${kind}-${suffix}`;
}

function assertUniqueMappedIds(ids: ReadonlyMap<string, string>, kind: 'contact' | 'customer') {
	if (new Set(ids.values()).size !== ids.size) throw new Error(`Cannot migrate duplicate ${kind} IDs`);
}

function assertUniqueSourceIds(records: readonly { id: string }[], kind: 'contact' | 'customer') {
	if (new Set(records.map((record) => record.id)).size !== records.length)
		throw new Error(`Cannot migrate duplicate source ${kind} IDs`);
}
