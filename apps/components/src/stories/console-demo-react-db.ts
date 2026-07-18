import { type CollectionConfig, createCollection, deepEquals } from '@tanstack/react-db';
import { liveQuery } from 'dexie';
import {
	ConsoleDemoDatabase,
	type ConsoleDemoPartition,
	type ContactRecord,
	type CustomerRecord,
	deleteContacts,
	deleteCustomers,
	listContacts,
	listCustomers,
	prepareConsoleDemoDatabase,
	putContacts,
	putCustomers,
	resetConsoleDemoPartition,
} from './console-demo-database';

type MutationTransaction<T extends { id: string }> = {
	mutations: Array<{ key: string; modified: T }>;
};

export type CreateConsoleDemoDataRuntimeOptions = {
	databaseName?: string;
	onSyncError?: (error: unknown) => void;
	partition: ConsoleDemoPartition;
	reset?: boolean;
};

export async function createConsoleDemoDataRuntime({
	databaseName,
	onSyncError = console.error,
	partition,
	reset,
}: CreateConsoleDemoDataRuntimeOptions) {
	const database = new ConsoleDemoDatabase(databaseName);
	await prepareConsoleDemoDatabase(database, partition, { reset });
	let refreshContacts: () => Promise<void> = async () => undefined;

	const customers = createDexieCollection<CustomerRecord>({
		id: `console-demo-${partition}-customer`,
		read: () => listCustomers(database, partition),
		onSyncError,
		persistInsert: (records) => putCustomers(database, partition, records),
		persistUpdate: (records) => putCustomers(database, partition, records),
		persistDelete: async (ids) => {
			await deleteCustomers(database, partition, ids);
			await refreshContacts();
		},
	});

	const contacts = createDexieCollection<ContactRecord>({
		id: `console-demo-${partition}-contact`,
		read: () => listContacts(database, partition),
		onSyncError,
		persistInsert: (records) => putContacts(database, partition, records),
		persistUpdate: (records) => putContacts(database, partition, records),
		persistDelete: (ids) => deleteContacts(database, partition, ids),
	});
	refreshContacts = contacts.refresh;

	return {
		contacts: contacts.collection,
		customers: customers.collection,
		database,
		partition,
		async dispose() {
			await Promise.all([customers.collection.cleanup(), contacts.collection.cleanup()]);
			database.close();
		},
		async reset() {
			await resetConsoleDemoPartition(database, partition);
			await Promise.all([customers.refresh(), contacts.refresh()]);
		},
	};
}

export type ConsoleDemoDataRuntime = Awaited<ReturnType<typeof createConsoleDemoDataRuntime>>;

type CreateDexieCollectionOptions<T extends { id: string }> = {
	id: string;
	onSyncError: (error: unknown) => void;
	persistDelete: (ids: readonly string[]) => Promise<void>;
	persistInsert: (records: readonly T[]) => Promise<void>;
	persistUpdate: (records: readonly T[]) => Promise<void>;
	read: () => Promise<T[]>;
};

function createDexieCollection<T extends { id: string }>({
	id,
	onSyncError,
	persistDelete,
	persistInsert,
	persistUpdate,
	read,
}: CreateDexieCollectionOptions<T>) {
	let refresh = async (): Promise<void> => {
		throw new Error(`${id} sync has not started`);
	};

	const config: CollectionConfig<T, string> = {
		id,
		gcTime: 60_000,
		getKey: (record) => record.id,
		startSync: true,
		sync: {
			rowUpdateMode: 'full',
			sync: ({ begin, write, commit, markReady }) => {
				let stopped = false;
				let ready = false;
				let previous = new Map<string, T>();
				let serial = Promise.resolve();

				const reconcile = async () => {
					const records = await read();
					if (stopped) return;
					const next = new Map(records.map((record) => [record.id, record]));
					begin();
					for (const [key, record] of previous) {
						if (!next.has(key)) write({ type: 'delete', value: record });
					}
					for (const [key, record] of next) {
						const old = previous.get(key);
						if (!old) write({ type: 'insert', value: record });
						else if (!deepEquals(old, record)) write({ type: 'update', value: record });
					}
					commit();
					previous = next;
					if (!ready) {
						ready = true;
						markReady();
					}
				};

				refresh = () => {
					const run = serial.then(reconcile);
					serial = run.catch(() => undefined);
					return run;
				};

				const subscription = liveQuery(read).subscribe({
					next: () => void refresh().catch(onSyncError),
					error: onSyncError,
				});
				return () => {
					stopped = true;
					subscription.unsubscribe();
				};
			},
		},
		onInsert: async ({ transaction }) => {
			await persistInsert(getModified(transaction as MutationTransaction<T>));
			await refresh();
		},
		onUpdate: async ({ transaction }) => {
			await persistUpdate(getModified(transaction as MutationTransaction<T>));
			await refresh();
		},
		onDelete: async ({ transaction }) => {
			await persistDelete(transaction.mutations.map((mutation) => String(mutation.key)));
			await refresh();
		},
	};

	return { collection: createCollection(config), refresh: () => refresh() };
}

function getModified<T extends { id: string }>(transaction: MutationTransaction<T>) {
	return transaction.mutations.map((mutation) => mutation.modified);
}
